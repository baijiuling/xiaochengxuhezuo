const express = require('express');
const axios = require('axios');
const router = express.Router();
const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");
const jwt = require('jsonwebtoken');

// 配置
const API_KEY = '8be999a37f20ecd3181112180bd86871.VqXBjvtOMZBLtyfN';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const JWT_SECRET = 'your_jwt_secret'; // 请替换为实际的密钥

// 创建缓存实例
const cache = new NodeCache({ stdTTL: 600 }); // 缓存10分钟

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});

// 中间件：验证JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.post('/angel_devil_api/analyze', authenticateToken, limiter, async (req, res) => {
  console.log('Received request:', req.body);
  try {
    const { input, scene } = req.body;
    const cacheKey = `${input}_${scene}`;

    // 检查缓存
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // 调用大模型 API
    const angelResult = await callGLM4API(input, scene, 'angel');
    const devilResult = await callGLM4API(input, scene, 'devil');

    const result = {
      angelVersion: angelResult,
      devilVersion: devilResult,
      timestamp: new Date().toISOString(),
      user: req.user.username
    };

    // 存入缓存
    cache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Error in /analyze:', error);
    res.status(500).json({ error: 'An error occurred during analysis', details: error.message });
  }
});

async function callGLM4API(input, scene, version) {
  try {
    const response = await axios.post(API_URL, {
      model: "glm-4",
      messages: [
        { role: "system", content: getSystemPrompt(scene, version) },
        { role: "user", content: input }
      ],
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
  const basePrompt = `你是一个${scene}场景下的意图分析助手。`;
  if (version === 'angel') {
    return basePrompt + "请以积极、善意的角度解读用户的意图，并给出建设性的建议。";
  } else {
    return basePrompt + "请以批评性、怀疑的角度解读用户的意图，指出可能存在的问题或隐藏的动机。";
  }
}

module.exports = router;

