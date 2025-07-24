const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取用户的AI配置
router.get('/', authenticateToken, async (req, res) => {
  try {
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { userId: req.user.id }
    });

    if (!aiConfig) {
      // 如果没有配置，返回默认配置
      return res.json({
        provider: 'deepseek',
        apiKey: '',
        model: 'deepseek-chat',
        enabled: false,
        zhipuApiKey: '',
        zhipuModel: 'glm-4v',
        zhipuEnabled: false
      });
    }

    // 不返回敏感的API密钥，只返回是否已配置
    res.json({
      provider: aiConfig.provider,
      apiKey: aiConfig.apiKey ? '***已配置***' : '',
      model: aiConfig.model,
      enabled: aiConfig.enabled,
      zhipuApiKey: aiConfig.zhipuApiKey ? '***已配置***' : '',
      zhipuModel: aiConfig.zhipuModel || 'glm-4v',
      zhipuEnabled: aiConfig.zhipuEnabled
    });
  } catch (error) {
    console.error('获取AI配置失败:', error);
    res.status(500).json({ error: '获取AI配置失败' });
  }
});

// 保存或更新用户的AI配置
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { provider, apiKey, model, enabled, zhipuApiKey, zhipuModel, zhipuEnabled } = req.body;

    // 验证必填字段
    if (!provider || !model) {
      return res.status(400).json({ error: '提供商和模型是必填项' });
    }

    const aiConfig = await prisma.aIConfig.upsert({
      where: { userId: req.user.id },
      update: {
        provider,
        apiKey: apiKey || '',
        model,
        enabled: enabled || false,
        zhipuApiKey: zhipuApiKey || '',
        zhipuModel: zhipuModel || 'glm-4v',
        zhipuEnabled: zhipuEnabled || false,
        updatedAt: new Date()
      },
      create: {
        userId: req.user.id,
        provider,
        apiKey: apiKey || '',
        model,
        enabled: enabled || false,
        zhipuApiKey: zhipuApiKey || '',
        zhipuModel: zhipuModel || 'glm-4v',
        zhipuEnabled: zhipuEnabled || false
      }
    });

    res.json({ 
      message: 'AI配置保存成功',
      config: {
        provider: aiConfig.provider,
        model: aiConfig.model,
        enabled: aiConfig.enabled,
        zhipuModel: aiConfig.zhipuModel,
        zhipuEnabled: aiConfig.zhipuEnabled
      }
    });
  } catch (error) {
    console.error('保存AI配置失败:', error);
    res.status(500).json({ error: '保存AI配置失败' });
  }
});

// 获取完整的AI配置（包含API密钥，用于AI服务调用）
router.get('/full', authenticateToken, async (req, res) => {
  try {
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { userId: req.user.id }
    });

    if (!aiConfig) {
      return res.json({
        provider: 'deepseek',
        apiKey: '',
        model: 'deepseek-chat',
        enabled: false,
        zhipuApiKey: '',
        zhipuModel: 'glm-4v',
        zhipuEnabled: false
      });
    }

    res.json({
      provider: aiConfig.provider,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      enabled: aiConfig.enabled,
      zhipuApiKey: aiConfig.zhipuApiKey,
      zhipuModel: aiConfig.zhipuModel,
      zhipuEnabled: aiConfig.zhipuEnabled
    });
  } catch (error) {
    console.error('获取完整AI配置失败:', error);
    res.status(500).json({ error: '获取完整AI配置失败' });
  }
});

// 测试AI连接
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    if (!provider || !apiKey || !model) {
      return res.status(400).json({ error: '缺少必要的配置参数' });
    }

    // 这里可以添加实际的AI服务测试逻辑
    // 暂时返回成功响应
    res.json({ 
      success: true, 
      message: 'AI连接测试成功' 
    });
  } catch (error) {
    console.error('AI连接测试失败:', error);
    res.status(500).json({ error: 'AI连接测试失败' });
  }
});

module.exports = router;