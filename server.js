const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const fs = require('fs');
const util = require('util');

const app = express();
const port = 3000;
const cache = new NodeCache({ stdTTL: 600 }); // 缓存10分钟

// 设置日志
const log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
const log_stdout = process.stdout;
console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

// 中间件
app.use(cors());
app.use(express.json());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP限制100个请求
});
app.use(limiter);

// GLM-4 API配置
const API_KEY = process.env.GLM_API_KEY;
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 路由
app.post('/angel_devil_api/analyze', async (req, res) => {
  try {
    const { input, scene } = req.body;
    const cacheKey = `${input}-${scene}`;
    
    // 检查缓存
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log('Returning cached result');
      return res.json(cachedResult);
    }

    const angelResult = await callGLM4API(input, scene, 'angel');
    const devilResult = await callGLM4API(input, scene, 'devil');

    const result = {
      angelVersion: angelResult,
      devilVersion: devilResult
    };

    // 存入缓存
    cache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Error in /analyze:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function callGLM4API(input, scene, version) {
  try {
    const response = await axios.post(API_URL, {
      model: "glm-4",
      messages: [
        { role: "system", content: getSystemPrompt(scene, version) },
        { role: "user", content: input }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling GLM-4 API:', error);
    throw error;
  }
}

function getSystemPrompt(scene, version) {
  // 根据场景和版本（天使/恶魔）返回适当的系统提示
  // 这里需要根据您的具体需求来实现
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
