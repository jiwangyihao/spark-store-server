import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { DevService } from './dev.service';
import * as bcrypt from 'bcrypt';
import { AxiosError } from 'axios';
import { Task } from '../schemas/task.schema';
import { task } from '../interfaces/task.interface';
let compare = require('deb-version-compare');

@Controller('dev')
export class DevController {
  constructor(private readonly devService: DevService) {}
  @Get('diffFromRepository')
  //从源拉取差异
  async diffFromRepository() {
    console.log('开始');
    //配置
    const configure = {
      sorts: [
        'chat',
        'development',
        'games',
        'image_graphics',
        'music',
        'network',
        'office',
        'others',
        'reading',
        'themes',
        'tools',
        'video',
      ],
      repository: 'https://core.shenmo.tech:23333',
      multiWordMaintainerList: [
        'Alastair McKinstry',
        'Aleksandr Gornostal',
        'Alexander Pozdnyakov',
        'Alexey Yakovenko',
        'Andrea Vacondio',
        'AnyDesk Software GmbH',
        'App by Troye',
        'Apple Music Electron Team',
        'Ascensio System SIA',
        'Aseprite Team',
        'Ashish Bharadwaj J',
        'Automattic, Inc.',
        'Baidu IA',
        'Barry & pack',
        'Beekeeper Studio Team',
        'Bjørn Erik Pedersen',
        'Brendan Forster',
        'Caesium Studio',
        'Cameron White',
        'Chen Qinghui',
        'Chugunov Roman',
        'Cider Collective',
        'Code Industry Ltd',
        'CrossOver Packager',
        'Cui Jiajin',
        'Dariusz Dwornikowski',
        'DataHammer Group',
        'DBeaver Corp',
        'Debian Deepin Packaging Team',
        'Debian freedesktop.org maintainers',
        'Debian GNOME Maintainers',
        'Debian Input Method Team',
        'Debian Multimedia Maintainers',
        'Debian OpenLDAP Maintainers',
        'Debian PhotoTools Maintainers',
        'Debian QA Group',
        'Debian WebKit Maintainers',
        'Debian Wine Party',
        'Debian X Strike Force',
        'Deepin IME Team',
        'Deepin mail',
        'Debian OpenSSL Team',
        'Deepin Packages Builder',
        'Deepin Sysdev',
        'Deepin WINE Team',
        'Discord Maintainer Team',
        'Dmitry Baryshev',
        'Dmitry E. Oboukhov',
        'Dylan Coakley',
        'Elliott Zheng',
        'Eugene G.',
        'Fabio Di Stasio',
        'Fabio Spampinato',
        'Feishu Linux Team',
        'Felix Rieseberg, felix@felixrieseberg.com',
        'Felix Rieseberg',
        'Ferdium Contributors',
        'Franklin Weng',
        'GB Studio',
        'gfdgd xi',
        'Google Earth Team',
        'Guangzhou Zaofu Technology Co., Ltd.',
        'Hendrik Erz',
        'Individual developer',
        'International GeoGebra Institute',
        'J. Sundermeyer',
        'Jaap Karssenberg',
        'Jellyfin Packaging Team',
        'Jendrik Seipp',
        'Jens Deters',
        'Jeroen Ploemen',
        'Jin Lixian',
        'Joshua Vickery',
        'Junyoung Choi',
        'Jussi Lind',
        'Klaus Sinani',
        'Laszlo Boszormenyi (GCS)',
        'Listen 1',
        'Liu Heng',
        'Lu Hongxu',
        'Lukas Bach',
        'LWKS Software Ltd',
        'Magnus Holmgren',
        'Manuel Ernesto Garcia',
        'Marc Espín Sanz',
        'Mark Text Contributors',
        'Matias Benedetto',
        'Matthijs Kooijman',
        'Mendeley Desktop Team',
        'Microsoft Corporation',
        'Microsoft Edge for Linux Team',
        'Mockplus Software LLC.',
        'Moein Alinaghian',
        'MongoDB Inc',
        'Notion Labs, Incorporated',
        'nteract contributors',
        'NxShell Team',
        'Oleguer Llopart',
        'Ondřej Surý',
        'OpenBoard Developers team',
        'Open Whisper Systems',
        'Patrik Laszlo',
        'Patrizio Bekerle',
        'Paul Pacifico',
        'Pavel Milanes Costa',
        'Person By Deepin WINE',
        'Petr Mrázek',
        'Peter Rudenko',
        'Popcorn-Time Project',
        'R-Tools Technology',
        'Remember The Milk',
        'Rhio Kim',
        'Ricardo Villalba',
        'Robin Ahle',
        'Rocket.Chat Support',
        'Rolf Leggewie',
        'Roman I Khimov',
        'SHENZHEN EDRAW SOFTWARE CO.LTD',
        'Skype Technologies S.A.',
        'Sogou IME Team',
        'Spark WINE Team',
        'Soroush Chehresa',
        'Steven Pusser',
        'Subtitler Maintainer',
        'The Ayatana Packagers',
        'The Electron-SSR Authors',
        'The Icalingua++ Authors',
        'The Infinite Kind',
        'Thomas Brouard',
        'Ubuntu Developers',
        'Valve Corporation',
        'Vivaldi Package Composer',
        'Wali Waqar',
        'WebTorrent, LLC',
        'Wei Xie',
        'Wemeet team',
        'WPS Office Community Team',
        'XMIND LTD.',
        'Yinan Qin',
        'Yue Yang',
        'Yusef Hassan',
        'Zhipeng Zhao',
      ],
      salt: bcrypt.genSaltSync(1),
      ignoreKeys: ['_id', '$__', '$isNew', '_doc', '__v'],
    };

    let multiWordMaintainer: Map<string, string> = new Map();

    configure.multiWordMaintainerList.forEach((item) => {
      multiWordMaintainer.set(bcrypt.hashSync(item, configure.salt), item);
    });

    //数据获取
    let jsonReqs: any[] = [];
    configure.sorts.forEach((sort) => {
      jsonReqs.push(
        this.devService
          .getAxios()
          .get(`${configure.repository}/store/${sort}/applist.json`)
          .then((res: { data: any }) => {
            return {
              sort: sort,
              data: res.data,
            };
          })
          .catch((e: AxiosError) => console.log(e.config.url)),
      );
    });

    const jsonPromise = Promise.all(jsonReqs).then(async (res) => {
      let jsonList: Map<string, Map<string, Map<string, any>>> = new Map();
      let downReqs: any[] = [];
      res.forEach((sortData) => {
        let sortList: Map<string, Map<string, any>> = new Map();
        sortData.data.forEach((data: { [s: string]: unknown }) => {
          const item: Map<string, any> = new Map(Object.entries(data));
          sortList.set(item.get('Pkgname'), item);
          downReqs.push(
            this.devService
              .getAxios()
              .get(
                encodeURI(
                  `${configure.repository}/store/${sortData.sort}/${item.get(
                    'Pkgname',
                  )}/download-times.txt`,
                ).replaceAll(/\+|_plus_/gi, encodeURIComponent('+')),
              )
              .then((res: { data: string }) => {
                return {
                  sort: sortData.sort,
                  package: item.get('Pkgname'),
                  data: parseInt(res.data),
                };
              })
              .catch(async (e: AxiosError) => {
                console.log(`Retry: ${e.config.url}`);
                return await this.devService
                  .getAxios()
                  .get(
                    encodeURI(
                      `${configure.repository}/store/${
                        sortData.sort
                      }/${item.get('Pkgname')}/download-times.txt`,
                    ).replaceAll(/\+|_plus_/gi, encodeURIComponent('+')),
                  )
                  .then((res: { data: string }) => {
                    return {
                      sort: sortData.sort,
                      package: item.get('Pkgname'),
                      data: parseInt(res.data),
                    };
                  })
                  .catch(async (e: AxiosError) => {
                    console.log(`Retry 2: ${e.config.url}`);
                    return await this.devService
                      .getAxios()
                      .get(
                        encodeURI(
                          `${configure.repository}/store/${
                            sortData.sort
                          }/${item.get('Pkgname')}/download-times.txt`,
                        ).replaceAll(/\+|_plus_/gi, encodeURIComponent('+')),
                      )
                      .then((res: { data: string }) => {
                        return {
                          sort: sortData.sort,
                          package: item.get('Pkgname'),
                          data: parseInt(res.data),
                        };
                      })
                      .catch((e: AxiosError) => {
                        console.log(`Retry failed: ${e.config.url}`);
                      });
                  });
              }),
          );
        });
        jsonList.set(sortData.sort, sortList);
      });
      const downRes = await Promise.all(downReqs);
      downRes.forEach((res) => {
        try {
          jsonList
            .get(res.sort)
            .get(res.package)
            .set('downTimes', parseInt(res.data));
        } catch (e) {
          console.log(e);
        }
      });
      return jsonList;
    });

    const packagePromise = this.devService
      .getAxios()
      .get(`${configure.repository}/store/Packages`)
      .then((res: { data: string }) => {
        let packageList = res.data.split('\n\n');
        const lastItem = packageList.pop();
        if (lastItem === '') {
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
          let lastProperty = '';
          item.split('\n').forEach((line) => {
            if (line.match(/^[\w-]+:\s?/gi)) {
              const lineArr = line.split(/:\s?(?!\/)/gi);
              application.set(lineArr[0], lineArr[1]);
              lastProperty = lineArr[0];
            } else {
              application.set(
                lastProperty,
                application.get(lastProperty) + '\n' + line,
              );
            }
          });

          //将维护者信息转为 Array
          if (application.has('Maintainer')) {
            let Maintainers = application.get('Maintainer');

            multiWordMaintainer.forEach((v, k) => {
              Maintainers = Maintainers.replace(v, k);
            });

            let maintainerList: any[] = [];
            const maintainers = Maintainers.split(/[ 、]/gi);
            maintainers.forEach((item: string) => {
              if (item.match(/<.+>$/gi)) {
                //此项包含邮箱信息
                if (item.match(/^<.+>$/gi)) {
                  //此项是纯邮箱信息，补加到上一项维护者结尾
                  maintainerList[maintainerList.length - 1] += ' ' + item;
                } else {
                  //此项是名字和邮箱中间没有空格的维护者信息，补加上
                  maintainerList.push(item.replace('<', ' <'));
                }
              } else if (item.match(/\[.+]$/gi)) {
                //此项包含网址信息
                if (item.match(/^\[.+]$/gi)) {
                  //此项是纯网址信息，补加到上一项维护者结尾
                  maintainerList[maintainerList.length - 1] += ' ' + item;
                } else {
                  //此项是名字和网址中间没有空格的维护者信息，补加上
                  maintainerList.push(item.replace('[', ' ['));
                }
              } else {
                //不是邮箱或网址信息
                multiWordMaintainer.forEach((v, k) => {
                  item = item.replace(k, v);
                });
                maintainerList.push(item);
              }
            });

            application.set(
              'Maintainer',
              maintainerList.map((item) => {
                multiWordMaintainer.forEach((v, k) => {
                  item = item.replace(k, v);
                });
                return item;
              }),
            );

            if (application.get('Package') === 'spark-microsoft-powerpoint') {
              console.log(application.get('Maintainer'));
            }
          }

          //将软件包大小转为数字
          if (application.has('Size')) {
            application.set('Size', parseInt(application.get('Size')));
          }

          //获取软件包分类
          application.set('Sort', [
            application.get('Filename').match(/\w+?(?=\/)/gi)[0],
          ]);

          if (
            application.get('Filename').match('depends') ||
            !jsonList
              .get(application.get('Sort')[0])
              ?.has(application.get('Package'))
          ) {
            //标明是依赖包或 Json 源中不存在的包
            application.set('Dependency', true);
            application.set('History', true);
            application.set(
              'Package',
              `${application.get('Package')}@${application.get('Version')}`,
            );
            if (!appListByPackage.has(application.get('Package'))) {
              appList.push(application);
              appListByPackage.set(application.get('Package'), application);
            }
          } else {
            //从 Json 获取信息
            const jsonPack = jsonList
              .get(application.get('Sort')[0])
              ?.get(application.get('Package'));

            //合并信息函数
            function fillInformation() {
              application.set('Name', jsonPack?.get('Name'));
              if (jsonPack.has('Author')) {
                application.set('Author', jsonPack.get('Author'));
              }
              jsonPack.delete('Author');
              if (
                !application
                  .get('Maintainer')
                  .find((item: string) =>
                    item.match(jsonPack?.get('Contributor')),
                  )
              ) {
                //贡献者与维护者不一样
                application
                  .get('Maintainer')
                  .push(jsonPack?.get('Contributor'));
              }
              jsonPack.delete('Contributor');
              if (!application.has('Homepage') && jsonPack?.has('Website')) {
                application.set('Homepage', jsonPack.get('Website'));
              }
              jsonPack.delete('Website');
              if (jsonPack?.has('More')) {
                application.set('More', jsonPack.get('More'));
              }
              jsonPack.delete('More');
              if (jsonPack?.has('Tags')) {
                application.set('Tags', jsonPack.get('Tags').split(';'));
              }
              jsonPack.delete('Tags');
              if (jsonPack?.has('img_urls')) {
                application.set(
                  'img_urls',
                  JSON.parse(jsonPack.get('img_urls')),
                );
              }
              jsonPack.delete('img_urls');
              if (jsonPack?.has('icons')) {
                application.set('icons', jsonPack.get('icons'));
              }
              jsonPack.delete('icons');

              jsonPack.delete('Pkgname');

              for (const [key, value] of jsonPack.entries()) {
                if (!application.has(key)) {
                  application.set(key, value);
                }
              }
            }

            if (application.get('Version') === jsonPack?.get('Version')) {
              if (appListByPackage.has(application.get('Package'))) {
                //Json 源中重复的软件包
                let appInList = appListByPackage.get(
                  application.get('Package'),
                );
                if (
                  compare(appInList?.get('Version'), application.get('Version'))
                ) {
                  //List 中的软件包更新，把新包作为历史版本归档
                  application.set(
                    'Package',
                    `${application.get('Package')}@${application.get(
                      'Version',
                    )}`,
                  );
                  application.set('History', true);
                  appInList?.get('Sort').push(application.get('Sort')[0]);
                  if (
                    !appListByPackage.hasOwnProperty(application.get('Package'))
                  ) {
                    appList.push(application);
                    appListByPackage.set(
                      application.get('Package'),
                      application,
                    );
                  }
                } else {
                  //新包更新，把 List 中的包当作历史版本归档
                  appInList?.set(
                    'Package',
                    `${appInList?.get('Package')}@${appInList?.get('Version')}`,
                  );
                  appInList?.set('History', true);

                  //清洗旧版本的多余信息
                  appInList?.delete('Name');
                  appInList?.delete('Author');
                  appInList?.delete('More');
                  appInList?.delete('Tags');
                  appInList?.delete('img_urls');
                  appInList?.delete('icons');

                  //为新包合并来自 Json 仓库的信息
                  fillInformation();

                  //补增分类信息
                  application.set(
                    'Sort',
                    application.get('Sort').concat(appInList?.get('Sort')),
                  );

                  appListByPackage.set(
                    appInList?.get('Package'),
                    <Map<string, any>>appInList,
                  );
                  appListByPackage.set(application.get('Package'), application);
                  appList.push(application);
                }
              } else {
                //非重复包（Json），为新包合并来自 Json 仓库的信息
                application.set('Name', jsonPack?.get('Name'));
                fillInformation();
                appListByPackage.set(application.get('Package'), application);
                appList.push(application);
              }
            } else {
              //重复包（Packages）
              application.set('History', true);
              application.set(
                'Package',
                `${application.get('Package')}@${application.get('Version')}`,
              );
              if (
                !appListByPackage.hasOwnProperty(application.get('Package'))
              ) {
                appList.push(application);
                appListByPackage.set(application.get('Package'), application);
              }
            }
          }
        });
        return appList;
      },
    );

    const dbPromise = this.devService.findAllApplication();

    const diffPromise = Promise.all([repoPromise, dbPromise]).then(
      async ([repoList, dbList]) => {
        console.log('diff start');
        let taskList: task[] = [];
        let repoListByPackage: Map<string, Map<string, any>> = new Map();
        repoList.forEach((app) =>
          repoListByPackage.set(app.get('Package'), app),
        );
        dbList.forEach((appInDb) => {
          if (repoListByPackage.has(appInDb['Package'])) {
            const appInRepo = repoListByPackage.get(appInDb['Package']);
            const set: { [s: string]: any } = {};
            const unset: string[] = [];

            if (appInDb['Package'] === 'qtscrcpy') {
              //console.log(appInDb);
              //console.log(appInRepo);
            }

            for (const [key, value] of Object.entries(appInDb.toObject())) {
              if (appInRepo?.has(key)) {
                if (
                  JSON.stringify(appInRepo.get(key)) !== JSON.stringify(value)
                ) {
                  set[key] = appInRepo.get(key);
                }
                appInRepo?.delete(key);
              } else {
                if (
                  !configure.ignoreKeys.includes(key) &&
                  appInDb[key]?.length !== 0
                ) {
                  unset.push(key);
                }
              }
            }
            appInRepo?.forEach((value, key) => {
              set[key] = value;
            });

            if (Object.entries(set).length > 0 || unset.length > 0) {
              taskList.push({
                Package: appInDb['Package'],
                Author: 'diff',
                CreateTime: new Date(),
                Type: 'Update',
                Status: 'Pending',
                Content: {
                  set: set,
                  unset: unset,
                },
              });
            }
          } else {
            taskList.push({
              Package: appInDb['Package'],
              Author: 'diff',
              CreateTime: new Date(),
              Type: 'Delete',
              Status: 'Pending',
            });
            repoListByPackage.delete(appInDb['Package']);
          }
        });

        //在数据库中不存在的包（新增）
        repoListByPackage.forEach((app) => {
          if (app.has('Package')) {
            taskList.push({
              Package: app.get('Package'),
              Author: 'diff',
              CreateTime: new Date(),
              Type: 'Add',
              Status: 'Pending',
              Content: {
                set: Object.fromEntries(app.entries()),
              },
            });
          }
        });

        for (const task of taskList) {
          await this.devService.updateTaskMany(task.Package, {
            $set: {
              Status: 'Outdated',
            },
          });
        }

        if (taskList.length > 0) {
          await this.devService.insertTaskMany(taskList);
        }
        return taskList;
      },
    );

    return await diffPromise;
  }

  @Get('getTaskList')
  //获取任务列表
  async getAppList(
    @Query('author') author: string,
    @Query('status') status: string,
  ): Promise<Task[]> {
    interface taskQuery {
      Author?: string;
      Status?: string;
    }

    const query: taskQuery = {};
    if (author) {
      query.Author = author;
    }
    if (status) {
      query.Status = status;
    }
    return this.devService.findAllTask(query);
  }

  @Post('approveTask')
  //批准任务
  async approveTask(
    @Body('token') token: string,
    @Body('id') id: number,
  ): Promise<{ msg: string }> {
    if (bcrypt.compareSync('sparkAdmin', token)) {
      const tasks = await this.devService.findTask(id);
      if (tasks.length === 1) {
        const task = tasks[0];
        const unset: { [s: string]: string } = {};

        if (task['Content']) {
          if (task['Content']['unset']) {
            task['Content']['unset'].forEach((field: string) => {
              unset[field] = '';
            });
          }
        }

        if (task['Status'] !== 'Pending') {
          throw new HttpException('Task Status Error', HttpStatus.NOT_FOUND);
        }

        switch (task['Type']) {
          case 'Add':
            await this.devService.insert(task['Content']['set']);
            break;
          case 'Update':
            await this.devService.update(task['Package'], {
              $set: task['Content']['set'],
              $unset: unset,
            });
            break;
          case 'Delete':
            await this.devService.delete(task['Package']);
            break;
          default:
            await this.devService.updateTask(id, {
              $set: {
                Status: 'Error',
                Reviewer: 'auto',
                ReviewTime: new Date(),
              },
            });
            throw new HttpException('Task Type Error', HttpStatus.NOT_FOUND);
        }

        await this.devService.updateTask(id, {
          $set: {
            Status: 'Approved',
            Reviewer: 'auto',
            ReviewTime: new Date(),
          },
        });

        return {
          msg: 'Success',
        };
      } else {
        throw new HttpException('Task Not Found', HttpStatus.NOT_FOUND);
      }
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
