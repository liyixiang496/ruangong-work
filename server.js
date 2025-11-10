const fetch = require('node-fetch');
const express = require('express');
const app = express();

// 跨域配置（确保前端正常调用）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 支持大图片上传
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 你的有效密钥（不变）
const BAIDU_API_KEY = "U3RlIPY6NeNvHkivaGQaT9RV"; 
const BAIDU_SECRET_KEY = "fsOAjmvYyjD4Mtm1eRDhRd5VqP4aqZPC";
const TONGYI_API_KEY = "sk-48bcbd07980c4c8db89129118fedd89f";

// 1. 获取百度Token
app.get('/baidu/token', async (req, res) => {
  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
  try {
    const response = await fetch(tokenUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('获取百度Token失败：', err);
    res.status(500).json({ error: '获取Token失败' });
  }
});

// 2. 植物识别接口
app.post('/baidu/plant', async (req, res) => {
  const { access_token, image } = req.body;
  const pureBase64 = image.replace(/^data:image\/\w+;base64,/, '');
  const plantUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v1/plant?access_token=${access_token}`;
  try {
    const response = await fetch(plantUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(pureBase64)}&top_num=1`
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('植物识别失败：', err);
    res.status(500).json({ error: '识别出错' });
  }
});

// 3. 养护建议接口（稳定版）
app.post('/get-advice', async (req, res) => {
  const { plantName } = req.body;
  try {
    const adviceResponse = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TONGYI_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        input: {
          prompt: `请给出${plantName}的3条养护建议，每条100字以内：1.光照温度；2.浇水施肥；3.常见问题。口语化。`
        }
      })
    });
    const adviceData = await adviceResponse.json();
    res.json(adviceData);
  } catch (error) {
    console.error("生成建议失败：", error);
    res.status(500).json({ error: "生成建议失败" });
  }
});

// 启动服务（端口3000）
app.listen(3000, () => {
  console.log('后端启动：http://localhost:3000');
});