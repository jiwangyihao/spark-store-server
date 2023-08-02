import jsdom from "jsdom";
const { JSDOM } = jsdom;
import createError from "http-errors";
import express from "express";
import logger from "morgan";
const axios = require("axios").default;
import compare from "deb-version-compare";
import cors from "cors";
import { AxiosError } from "axios";
import { appCol, taskCol, elastic } from "./api";
import CryptoJS from "crypto-js";
import { ObjectId } from "mongodb";
import bodyParser from "body-parser";
import { it } from "node:test";

const app = express();

app.use(
  cors({
    origin: [
      "https://www.spark-app.store", //正式渠道
      "http://localhost:9000", //本地测试
      "https://spark.jwyihao.top", //Vercel 实时构建
      "https://jiwangyihao.github.io", //GitHub Pages 实时构建
      "https://deepin-community-store.gitee.io", //Gitee Pages 实时构建
    ],
    optionsSuccessStatus: 200,
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.send("这是基于 Express 和 MongoDB 制作的星火应用商店后端!");
});

//从 Gitee Release 获取更新信息
app.get("/latest", async (_req, res) => {
  const config = {
    repository: "https://gitee.com/deepin-community-store/spark-store",
  };
  const response = (await axios.get(`${config.repository}/releases/latest`))
    .data;
  const doc = new JSDOM(response).window.document;

  let details: string[] = [];
  doc
    .querySelectorAll(".release-body .content .markdown-body li")
    .forEach((el) => details.push(el.textContent!));

  const result = {
    version: doc
      .querySelector(".release-meta .tag-name")
      ?.textContent?.trimStart()
      .trimEnd(),
    time: doc
      .querySelector(".release-meta .release-time")
      ?.textContent?.trimStart()
      .trimEnd(),
    details: details,
  };

  res.json(result);
});

interface updateItem {
  version: string | undefined;
  time: string | undefined;
  details: string[];
}

//从 Gitee Release 获取更新日志
app.get("/history", async (req, res) => {
  const config = {
    repository: "https://gitee.com/deepin-community-store/spark-store",
  };
  const response = (
    await axios.get(`${config.repository}/releases?page=${req.query["page"]}`)
  ).data;
  const doc = new JSDOM(response).window.document;

  let updateHistory: updateItem[] = [];

  doc.querySelectorAll(".release-tag-item").forEach((item) => {
    let details: string[] = [];
    item
      .querySelectorAll(".release-body .content .markdown-body li")
      .forEach((el) => details.push(el.textContent!));

    const result = {
      version: item
        .querySelector(".release-meta .tag-name")
        ?.textContent?.trimStart()
        .trimEnd(),
      time: item
        .querySelector(".release-meta .release-time")
        ?.textContent?.trimStart()
        .trimEnd(),
      details: details,
    };

    if (!item.querySelector(".pre-version")) {
      updateHistory.push(result);
    }
  });

  const returned = {
    status: response.status,
    isEnded:
      doc.querySelector(".pagination>:last-child")?.textContent ===
      req.query["page"],
    data: updateHistory,
  };

  res.json(returned);
});

interface task {
  Package: string;
  Author: string;
  CreateTime: Date;
  Reviewer?: string;
  ReviewTime?: Date;
  Type: string;
  Status: string;
  Content?: {
    set?: {
      [s: string]: any;
    };
    unset?: string[];
  };
}

//从旧源比较差异
app.get("/diffFromRepository", (_req, res) => {
  async function process() {
    //配置
    const configure = {
      sorts: [
        "chat",
        "development",
        "games",
        "image_graphics",
        "music",
        "network",
        "office",
        "others",
        "reading",
        "themes",
        "tools",
        "video",
      ],
      repository: "https://core.shenmo.tech:23333",
      multiWordMaintainerList: [
        "Deepin WINE Team",
        "Spark WINE Team",
        "Microsoft Edge for Linux Team",
        "WPS Office Community Team",
        "Debian Deepin Packaging Team",
      ],
    };

    //数据获取
    let jsonReqs: any[] = [];
    configure.sorts.forEach((sort) => {
      jsonReqs.push(
        axios
          .get(`${configure.repository}/store/${sort}/applist.json`)
          .then((res: { data: any }) => {
            return {
              sort: sort,
              data: res.data,
            };
          })
          .catch((e: AxiosError) => console.log(e.config.url))
      );
    });

    const jsonPromise = Promise.all(jsonReqs).then(async (res) => {
      let jsonList: Map<string, Map<string, Map<string, any>>> = new Map();
      let downReqs: any[] = [];
      res.forEach((sortData) => {
        let sortList: Map<string, Map<string, any>> = new Map();
        sortData.data.forEach((data: { [s: string]: unknown }) => {
          const item: Map<string, any> = new Map(Object.entries(data));
          sortList.set(item.get("Pkgname"), item);
          downReqs.push(
            axios
              .get(
                encodeURI(
                  `${configure.repository}/store/${sortData.sort}/${item.get(
                    "Pkgname"
                  )}/download-times.txt`
                ).replaceAll(/\+|_plus_/gi, encodeURIComponent("+"))
              )
              .then((res: { data: string }) => {
                return {
                  sort: sortData.sort,
                  package: item.get("Pkgname"),
                  data: parseInt(res.data),
                };
              })
              .catch((e: AxiosError) => console.log(e.config.url))
          );
        });
        jsonList.set(sortData.sort, sortList);
      });
      const downRes = await Promise.all(downReqs);
      downRes.forEach((res) => {
        try {
          jsonList.get(res.sort)?.get(res.package)?.set("downTimes", res.data);
        } catch (e) {
          console.log(e);
        }
      });
      return jsonList;
    });

    const packagePromise = axios
      .get(`${configure.repository}/store/Packages`)
      .then((res: { data: string }) => {
        let packageList = res.data.split("\n\n");
        const lastItem = packageList.pop();
        if (lastItem === "") {
          return packageList;
        } else {
          packageList.push(lastItem!);
          return packageList;
        }
      })
      .catch((e: AxiosError) => console.log(e.config.url));
    //dbPromise

    //源数据合并去重
    const repoPromise = Promise.all([jsonPromise, packagePromise]).then(
      ([jsonList, packageList]: [
        Map<string, Map<string, Map<string, any>>>,
        string[],
      ]) => {
        let appList: Map<string, any>[] = [];
        let appListByPackage: Map<string, Map<string, any>> = new Map();

        //处理 Packages
        packageList.forEach((item: string) => {
          const application: Map<string, any> = new Map();

          //按行解析 Packages
          let lastProperty = "";
          item.split("\n").forEach((line) => {
            if (line.match(/^[\w-]+: /gi)) {
              const lineArr = line.split(": ");
              application.set(lineArr[0], lineArr[1]);
              lastProperty = lineArr[0];
            } else {
              application.set(
                lastProperty,
                application.get(lastProperty) + "\n" + line
              );
            }
          });

          //将维护者信息转为 Array
          if (application.has("Maintainer")) {
            let multiWordMaintainer: Map<string, string> = new Map();
            let Maintainers = application.get("Maintainer");

            configure.multiWordMaintainerList.forEach((item) => {
              multiWordMaintainer.set(CryptoJS.MD5(item).toString(), item);
              Maintainers = Maintainers.replace(
                item,
                CryptoJS.MD5(item).toString()
              );
            });

            let maintainerList: any[] = [];
            const maintainers = Maintainers.split(" ");
            maintainers.forEach((item: string) => {
              if (item.match(/<.+>$/gi)) {
                //此项包含邮箱信息
                if (item.match(/^<.+>$/gi)) {
                  //此项是纯邮箱信息，补加到上一项维护者结尾
                  maintainerList[maintainerList.length - 1] += " " + item;
                } else {
                  //此项是名字和邮箱中间没有空格的维护者信息，补加上
                  item.replace("<", " <");
                  maintainerList.push(item);
                }
              } else {
                //不是邮箱信息
                if (multiWordMaintainer.has(CryptoJS.MD5(item).toString())) {
                  maintainerList.push(
                    multiWordMaintainer.get(CryptoJS.MD5(item).toString())
                  );
                } else {
                  maintainerList.push(item);
                }
              }
            });
            application.set("Maintainer", maintainerList);
          }

          //将软件包大小转为数字
          if (application.has("Size")) {
            application.set("Size", parseInt(application.get("Size")));
          }

          //获取软件包分类
          application.set("Sort", [
            application.get("Filename").match(/\w+?(?=\/)/gi)[0],
          ]);

          if (
            application.get("Filename").match("depends") ||
            !jsonList
              .get(application.get("Sort")[0])
              ?.has(application.get("Package"))
          ) {
            //标明是依赖包或 Json 源中不存在的包
            application.set("Dependency", true);
            application.set("History", true);
            application.set(
              "Package",
              `${application.get("Package")}@${application.get("Version")}`
            );
            if (!appListByPackage.has(application.get("Package"))) {
              appList.push(application);
              appListByPackage.set(application.get("Package"), application);
            }
          } else {
            //从 Json 获取信息
            const jsonPack = jsonList
              .get(application.get("Sort")[0])
              ?.get(application.get("Package"));

            //合并信息函数
            function fillInformation() {
              application.set("Name", jsonPack?.get("Name"));
              if (jsonPack?.has("Author")) {
                application.set("Author", jsonPack.get("Author"));
              }
              if (
                !application
                  .get("Maintainer")
                  .find((item: string) =>
                    item.match(jsonPack?.get("Contributor"))
                  )
              ) {
                //贡献者与维护者不一样
                application
                  .get("Maintainer")
                  .push(jsonPack?.get("Contributor"));
              }
              if (!application.has("Homepage") && jsonPack?.has("Website")) {
                application.set("Homepage", jsonPack.get("Website"));
              }
              if (jsonPack?.has("More")) {
                application.set("More", jsonPack.get("More"));
              }
              if (jsonPack?.has("Tags")) {
                application.set("Tags", jsonPack.get("Tags").split(";"));
              }
              if (jsonPack?.has("img_urls")) {
                application.set(
                  "img_urls",
                  JSON.parse(jsonPack.get("img_urls"))
                );
              }
              if (jsonPack?.has("icons")) {
                application.set("icons", jsonPack.get("icons"));
              }
            }

            if (application.get("Version") === jsonPack?.get("Version")) {
              if (appListByPackage.has(application.get("Package"))) {
                //Json 源中重复的软件包
                let appInList = appListByPackage.get(
                  application.get("Package")
                );
                if (
                  compare(appInList?.get("Version"), application.get("Version"))
                ) {
                  //List 中的软件包更新，把新包作为历史版本归档
                  application.set(
                    "Package",
                    `${application.get("Package")}@${application.get(
                      "Version"
                    )}`
                  );
                  application.set("History", true);
                  appInList?.get("Sort").push(application.get("Sort")[0]);
                  if (
                    !appListByPackage.hasOwnProperty(application.get("Package"))
                  ) {
                    appList.push(application);
                    appListByPackage.set(
                      application.get("Package"),
                      application
                    );
                  }
                } else {
                  //新包更新，把 List 中的包当作历史版本归档
                  appInList?.set(
                    "Package",
                    `${appInList?.get("Package")}@${appInList?.get("Version")}`
                  );
                  appInList?.set("History", true);

                  //清洗旧版本的多余信息
                  appInList?.delete("Name");
                  appInList?.delete("Author");
                  appInList?.delete("More");
                  appInList?.delete("Tags");
                  appInList?.delete("img_urls");
                  appInList?.delete("icons");

                  //为新包合并来自 Json 仓库的信息
                  fillInformation();

                  //补增分类信息
                  application.set(
                    "Sort",
                    application.get("Sort").concat(appInList?.get("Sort"))
                  );

                  appListByPackage.set(
                    appInList?.get("Package"),
                    <Map<string, any>>appInList
                  );
                  appListByPackage.set(application.get("Package"), application);
                  appList.push(application);
                }
              } else {
                //非重复包（Json），为新包合并来自 Json 仓库的信息
                application.set("Name", jsonPack?.get("Name"));
                fillInformation();
                appListByPackage.set(application.get("Package"), application);
                appList.push(application);
              }
            } else {
              //重复包（Packages）
              application.set("History", true);
              application.set(
                "Package",
                `${application.get("Package")}@${application.get("Version")}`
              );
              if (
                !appListByPackage.hasOwnProperty(application.get("Package"))
              ) {
                appList.push(application);
                appListByPackage.set(application.get("Package"), application);
              }
            }
          }
        });
        return appList;
      }
    );

    const dbPromise = appCol.find().toArray();

    const diffPromise = Promise.all([repoPromise, dbPromise]).then(
      async ([repoList, dbList]) => {
        let taskList: task[] = [];
        let repoListByPackage: Map<string, Map<string, any>> = new Map();
        repoList.forEach((app) =>
          repoListByPackage.set(app.get("Package"), app)
        );
        dbList.forEach((appInDb) => {
          if (repoListByPackage.has(appInDb["Package"])) {
            const appInRepo = repoListByPackage.get(appInDb["Package"]);
            const set: { [s: string]: any } = {};
            const unset: string[] = [];
            for (const [key, value] of Object.entries(appInDb)) {
              if (appInRepo?.has(key)) {
                if (!appInRepo.get(key) === value) {
                  set[key] = appInRepo.get(key);
                }
                appInRepo?.delete(key);
              } else {
                if (key !== "_id") {
                  unset.push(key);
                }
              }
            }
            appInRepo?.forEach((value, key) => {
              set[key] = value;
            });
            if (Object.entries(set).length > 0 && unset.length > 0) {
              taskList.push({
                Package: appInDb["Package"],
                Author: "diff",
                CreateTime: new Date(),
                Type: "Update",
                Status: "Pending",
                Content: {
                  set: set,
                  unset: unset,
                },
              });
            }
          } else {
            taskList.push({
              Package: appInDb["Package"],
              Author: "diff",
              CreateTime: new Date(),
              Type: "Delete",
              Status: "Pending",
            });
            repoListByPackage.delete(appInDb["Package"]);
          }
        });

        //在数据库中不存在的包（新增）
        repoListByPackage.forEach((app) => {
          if (app.has("Package")) {
            taskList.push({
              Package: app.get("Package"),
              Author: "diff",
              CreateTime: new Date(),
              Type: "Add",
              Status: "Pending",
              Content: {
                set: Object.fromEntries(app.entries()),
              },
            });
          }
        });

        for (const task of taskList) {
          await taskCol.updateMany(
            {
              Package: task.Package,
            },
            {
              $set: {
                Status: "Outdated",
              },
            }
          );
        }

        if (taskList.length > 0) {
          await taskCol.insertMany(taskList);
        }
        return taskList;
      }
    );

    return await diffPromise;
  }
  process().then(async (taskList) => {
    res.json(taskList);
    //res.json(        appList.map((item) => (Object.fromEntries(item.entries()))),      )
  });
});

app.get("/getTaskList", (req, res) => {
  interface taskQuery {
    Author?: string;
    Status?: string;
  }

  const query: taskQuery = {};
  if (req.query["author"]) {
    query.Author = <string>req.query["author"];
  }
  if (req.query["status"]) {
    query.Status = <string>req.query["status"];
  }
  taskCol
    .find(query)
    .toArray()
    .then((taskList) => res.json(taskList));
});

app.post("/approveTask", (req, res) => {
  const process = async () => {
    if (req.body["token"] !== CryptoJS.MD5("sparkAdmin")) {
      const tasks = await taskCol
        .find({
          _id: new ObjectId(req.body["id"]),
        })
        .toArray();
      if (tasks.length === 1) {
        const task = tasks[0];
        const unset: { [s: string]: string } = {};
        if (task.hasOwnProperty("Content")) {
          if (task["Content"].hasOwnProperty("unset")) {
            task["Content"]["unset"].forEach((field: string) => {
              unset[field] = "";
            });
          }
        }

        if (task["Status"] !== "Pending") {
          res.json({
            status: 404,
            msg: "Task Status Error.",
          });
        }

        switch (task["Type"]) {
          case "Add":
            await appCol.insertOne(task["Content"]["set"]);
            break;
          case "Update":
            await appCol.updateOne(
              {
                Package: task["Package"],
              },
              {
                $set: task["Content"]["set"],
                $unset: unset,
              }
            );
            break;
          case "Delete":
            await appCol.deleteOne({
              Package: task["Package"],
            });
            break;
          default:
            await taskCol.updateOne(task, {
              $set: {
                Status: "Error",
              },
            });
            res.json({
              status: 404,
              msg: "Task Type Error.",
            });
            break;
        }

        await taskCol.updateOne(
          {
            _id: new ObjectId(task._id),
          },
          {
            $set: {
              Status: "Approved",
            },
          }
        );

        res.json({
          status: 200,
          msg: "Succeeded.",
          result: await appCol.findOne({
            Package: task["Package"],
          }),
        });
      } else {
        res.json({
          status: 404,
          msg: "Task Not Found.",
        });
      }
    } else {
      res.json({
        status: 404,
        msg: "Not Authorised.",
      });
    }
  };

  process().then();
});

app.get("/getAppList", (req, res) => {
  interface listQuery {
    Sort?: string;
    Tags?: string;
  }

  const query: listQuery = {};
  if (req.query["sort"]) {
    query.Sort = <string>req.query["sort"];
  }
  if (req.query["tag"]) {
    query.Tags = <string>req.query["tag"];
  }
  appCol
    .find(query, {
      projection: {
        Package: 1,
        Name: 1,
        More: 1,
      },
    })
    .toArray()
    .then((appList) => res.json(appList));
});

app.get("/getAppDetail", (req, res) => {
  appCol
    .findOne({ Package: req.query["package"] })
    .then((appDetail) => res.json(appDetail));
});

app.get("/search", (req, res) => {
  elastic
    .search({
      query: {
        bool: {
          should: [
            {
              match: {
                Name: <string>req.query["keyword"],
              },
            },
            {
              match: {
                More: <string>req.query["keyword"],
              },
            },
          ],
        },
      },
      filter_path:
        "took,hits.hits._id,hits.hits._score,hits.hits._source.Name,hits.hits._source.More",
      size: 1000,
    })
    .then((appList) => {
      const results: Array<{
        Package: string;
        Name: string;
        More: string;
        score: number;
      }> = [];
      appList.hits.hits.forEach((item) =>
        results.push({
          Package: (<{ Package: string; Name: string; More: string }>(
            item._source
          )).Package,
          Name: (<{ Package: string; Name: string; More: string }>item._source)
            .Name,
          More: (<{ Package: string; Name: string; More: string }>item._source)
            .More,
          score: item._score!,
        })
      );
      res.json(results);
    });
});

app.get("/robots.txt", (_req, res) => {
  res.send(`User-agent: *
    Disallow: /`);
});

// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, _req, res) {
  res.status(err.status || 500);
  res.send("ERROR");
} as express.ErrorRequestHandler);

export default app;
