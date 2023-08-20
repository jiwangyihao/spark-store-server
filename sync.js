const axios = require('axios').default;
const bcrypt = require('bcrypt');

const config = {
  server: 'http://localhost:3000',
};

const token = bcrypt.hashSync('sparkAdmin', 10);

const procedure = async () => {
  console.log('正在从仓库拉取差异……');

  const newTaskList = await axios.get(
    `${config.server}/dev/diffFromRepository`,
  );

  console.log(`拉取差异成功，新增任务 ${newTaskList.data.length} 个`);

  console.log(`准备获取待处理任务列表`);

  const taskList = await axios.get(
    `${config.server}/dev/getTaskList?author=diff&status=Pending`,
  );

  console.log(`获取任务列表成功，当前待处理任务 ${taskList.data.length} 个`);

  for (const task of taskList.data) {
    const index = taskList.data.indexOf(task);
    await axios.post(`${config.server}/dev/approveTask`, {
      id: task._id,
      token: token,
    });
    console.log(`已批准任务（${index + 1}/${taskList.data.length}）`);
  }
};

procedure().then();
