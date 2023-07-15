const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const axios = require("axios").default;
const URI = require("uri-js");
const compare = require("deb-version-compare");
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:9000',
    'https://spark.jwyihao.top',
    'https://www.spark-app.store'
  ],
  optionsSuccessStatus: 200
}));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/", (req, res) => {
  res.send("这是基于 Express 和 MongoDB 制作的星火应用商店后端!");
});

//从 Gitee Release 获取更新信息
app.get("/latest", async (req, res) => {
  const config={
    repository:'https://gitee.com/deepin-community-store/spark-store'
  }
  const response = (await axios.get(`${config.repository}/releases/latest`)).data
  const doc = new JSDOM(response, 'text/html').window.document

  let details=[]
  doc.querySelectorAll('.release-body .content .markdown-body li').forEach(el=>details.push(el.textContent))

  const result = {
    version:doc.querySelector('.release-meta .tag-name').textContent.trimStart().trimEnd(),
    time:doc.querySelector('.release-meta .release-time').textContent.trimStart().trimEnd(),
    details:details
  }

  res.json(result);
});

//从 Gitee Release 获取更新日志
app.get("/history", async (req, res) => {
  const config={
    repository:'https://gitee.com/deepin-community-store/spark-store'
  }
  const response = (await axios.get(`${config.repository}/releases?page=${req.query["page"]}`)).data
  const doc = new JSDOM(response, 'text/html').window.document

  let updateHistory=[]

  doc.querySelectorAll('.release-tag-item').forEach(item=>{
    let details=[]
    item.querySelectorAll('.release-body .content .markdown-body li').forEach(el=>details.push(el.textContent))

    const result = {
      version:item.querySelector('.release-meta .tag-name').textContent.trimStart().trimEnd(),
      time:item.querySelector('.release-meta .release-time').textContent.trimStart().trimEnd(),
      details:details
    }

    if (!item.querySelector('.pre-version')) {
      updateHistory.push(result)
    }
  })

  res.json(updateHistory);
});

//从旧源比较差异
app.get("/diffFromRepository", (req, res) => {
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
      repository: "https://d.store.deepinos.org.cn",
    };

    //数据获取
    let jsonReqs = [];
    configure.sorts.forEach((sort) => {
      jsonReqs.push(
        axios
          .get(`${configure.repository}/store/${sort}/applist.json`)
          .then((res) => {
            return {
              sort: sort,
              data: res.data,
            };
          })
      );
    });

    const jsonPromise = Promise.all(jsonReqs).then(async (res) => {
      let jsonList = {};
      let downReqs = [];
      res.forEach((sortData) => {
        let sortList = {};
        sortData.data.forEach((item) => {
          sortList[item["Pkgname"]] = item;
          downReqs.push(
            axios
              .get(
                URI.serialize(
                  URI.parse(
                    `${configure.repository}/store/${sortData.sort}/${item["Pkgname"]}/download-times.txt`
                  )
                ).replaceAll(/\+|_plus_/gi, encodeURIComponent("+"))
              )
              .then((res) => {
                return {
                  sort: sortData.sort,
                  package: item["Pkgname"],
                  data: parseInt(res.data),
                };
              })
          );
        });
        jsonList[sortData.sort] = sortList;
      });
      const downRes = await Promise.all(downReqs);
      downRes.forEach((res) => {
        jsonList[res.sort][res.package].downTimes = res.data;
      });
      return jsonList;
    });

    const packagePromise = axios
      .get(`${configure.repository}/Packages`)
      .then((res) => {
        let packageList = res.data.split("\n\n");
        const lastItem = packageList.pop();
        if (lastItem === "") {
          return packageList;
        } else {
          packageList.push(lastItem);
          return packageList;
        }
      });
    //dbPromise

    //源数据合并去重
    const repoPromise = Promise.all([jsonPromise, packagePromise]).then(
      ([jsonList, packageList]) => {
        let appList = [];
        let appListByPackage = {};

        //处理 Packages
        packageList.forEach((item) => {
          const application = {};

          //按行解析 Packages
          let lastProperty = "";
          item.split("\n").forEach((line) => {
            if (line.match(/^[\w-]+: /gi)) {
              const lineArr = line.split(": ");
              application[lineArr[0]] = lineArr[1];
              lastProperty = lineArr[0];
            } else {
              application[lastProperty] += "\n" + line;
            }
          });

          //将维护者信息转为 Array
          if (application.hasOwnProperty("Maintainer")) {
            let maintainerList = [];
            const maintainers = application.Maintainer.split(" ");
            maintainers.forEach((item) => {
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
                if (item === "WINE") {
                  //特殊情况处理（Deepin WINE Team / Spark WINE Team）
                  if (
                    maintainerList[maintainerList.length - 1].match(
                      /Deepin|Spark/gi
                    )
                  ) {
                    maintainerList[maintainerList.length - 1] += " " + item;
                  } else {
                    maintainerList.push(item);
                  }
                } else if (item === "Edge") {
                  //特殊情况处理（Microsoft Edge for Linux Team）
                  if (
                    maintainerList[maintainerList.length - 1].match("Microsoft")
                  ) {
                    maintainerList[maintainerList.length - 1] += " " + item;
                  } else {
                    maintainerList.push(item);
                  }
                } else if (item === "Office") {
                  //特殊情况处理（WPS Office Community Team）
                  if (maintainerList[maintainerList.length - 1].match("WPS")) {
                    maintainerList[maintainerList.length - 1] += " " + item;
                  } else {
                    maintainerList.push(item);
                  }
                } else if (item === "Deepin") {
                  //特殊情况处理（Debian Deepin Packaging Team）
                  if (maintainerList[maintainerList.length - 1] === "Debian") {
                    maintainerList[maintainerList.length - 1] += " " + item;
                  } else {
                    maintainerList.push(item);
                  }
                } else if (item === "Packaging") {
                  //特殊情况处理（Debian Deepin Packaging Team）
                  if (
                    maintainerList[maintainerList.length - 1] ===
                    "Debian Deepin"
                  ) {
                    maintainerList[maintainerList.length - 1] += " " + item;
                  } else {
                    maintainerList.push(item);
                  }
                } else if (
                  item === "Team" ||
                  item === "Linux" ||
                  item === "for" ||
                  item === "Community"
                ) {
                  maintainerList[maintainerList.length - 1] += " " + item;
                } else {
                  maintainerList.push(item);
                }
              }
            });
            application.Maintainer = maintainerList;
          }

          //将软件包大小转为数字
          if (application.hasOwnProperty("Size")) {
            application.Size = parseInt(application.Size.toString());
          }

          //获取软件包分类
          application.Sort = [
            application["Filename"].match(/(?<=store\/)\w+?(?=\/)/gi)[0],
          ];

          if (
            application["Filename"].match("depends") ||
            !jsonList[application.Sort[0]].hasOwnProperty(application.Package)
          ) {
            //标明是依赖包或 Json 源中不存在的包
            application.Dependency = true;
            application.History = true;
            application.Package += `@${application.Version}`;
            if (!appListByPackage.hasOwnProperty(application.Package)) {
              appList.push(application);
              appListByPackage[application.Package] = application;
            }
          } else {
            //从 Json 获取信息
            const jsonPack = jsonList[application.Sort[0]][application.Package];

            //合并信息函数
            function fillInformation() {
              application.Name = jsonPack.Name;
              if (jsonPack.hasOwnProperty("Author")) {
                application.Author = jsonPack.Author;
              }
              if (
                !application.Maintainer.find((item) =>
                  item.toString().match(jsonPack.Contributor)
                )
              ) {
                //贡献者与维护者不一样
                application.Maintainer.push(jsonPack.Contributor);
              }
              if (
                !application.hasOwnProperty("Homepage") &&
                jsonPack.hasOwnProperty("Website")
              ) {
                application.Homepage = jsonPack.Website;
              }
              if (jsonPack.hasOwnProperty("More")) {
                application.More = jsonPack.More;
              }
              if (jsonPack.hasOwnProperty("Tags")) {
                application.Tags = jsonPack.Tags.split(";");
              }
              if (jsonPack.hasOwnProperty("img_urls")) {
                application.img_urls = JSON.parse(jsonPack.img_urls);
              }
              if (jsonPack.hasOwnProperty("icons")) {
                application.icons = jsonPack.icons;
              }
            }

            if (application.Version === jsonPack.Version) {
              if (appListByPackage.hasOwnProperty(application.Package)) {
                //Json 源中重复的软件包
                let appInList = appListByPackage[application.Package];
                if (compare(appInList.Version, application.Version)) {
                  //List 中的软件包更新，把新包作为历史版本归档
                  application.Package += `@${application.Version}`;
                  application.History = true;
                  appInList.Sort.push(application.Sort[0]);
                  if (!appListByPackage.hasOwnProperty(application.Package)) {
                    appList.push(application);
                    appListByPackage[application.Package] = application;
                  }
                } else {
                  //新包更新，把 List 中的包当作历史版本归档
                  appInList.Package += `@${appInList.Version}`;
                  appInList.History = true;

                  //清洗旧版本的多余信息
                  delete appInList.Name;
                  delete appInList.Author;
                  delete appInList.More;
                  delete appInList.Tags;
                  delete appInList.img_urls;
                  delete appInList.icons;

                  //为新包合并来自 Json 仓库的信息
                  fillInformation();

                  //补增分类信息
                  application.Sort = application.Sort.concat(appInList.Sort);

                  appListByPackage[appInList.Package] = appInList;
                  appListByPackage[application.Package] = application;
                  appList.push(application);
                }
              } else {
                //非重复包（Json），为新包合并来自 Json 仓库的信息
                application.Name = jsonPack.Name;
                fillInformation();
                appListByPackage[application.Package] = application;
                appList.push(application);
              }
            } else {
              //重复包（Packages）
              application.History = true;
              application.Package += `@${application.Version}`;
              if (!appListByPackage.hasOwnProperty(application.Package)) {
                appList.push(application);
                appListByPackage[application.Package] = application;
              }
            }
          }
        });
        return appList;
      }
    );

    return await repoPromise;
  }
  process().then((appList) => res.json(appList));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.send("ERROR");
});

module.exports = app;
