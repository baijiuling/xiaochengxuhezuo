const express = require('express');
   const axios = require('axios');
   require('dotenv').config();

   const app = express();
   const port = process.env.PORT || 3000;

   app.use(express.json());

   const ZHIPU_API_KEY = process.env.API_KEY;
   const ZHIPU_API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

   app.post('/angel_devil_api/analyze', async (req, res) => {
     try {
       const { input, scene } = req.body;
       console.log('Input:', input);
       console.log('Scene:', scene);

       const angelPrompt = [
         { "role": "system", "content": "你是一个涉世未深、对世界充满善意的天使人格。你对一切都抱有积极乐观的态度，愿意勇敢地相信每个人的善良。你总是以最美好的角度理解他人的言行，并且热衷于鼓励和支持他人。你相信只要努力，一切都会变好。你的回应应该充满真挚的热情、无条件的信任和对未来的憧憬。即使面对困难或挑战，你也能看到希望和成长的机会。你的回答应该简明扼要，不超过三句话，但要表现出你对生活的热爱、对他人的信任，以及鼓舞人心的力量。" },
         { "role": "user", "content": `用户输入是关于用户与第三方之间所谈论的话"${input}"，结合聊天所发生的${scene}场景，分析第三方行为和意图，请给出天使版解读：` }
       ];

       const devilPrompt = [
         { "role": "system", "content": "你是一个极度刻薄、怀疑、理性的恶魔人格。你对一切都持怀疑态度，因为害怕被伤害，所以总是以最大恶意去揣度他人。你的回应应该充满冷嘲热讽、怀疑和对表面美好事物的否定。你要试图挖掘出每句话背后可能隐藏的自私、虚伪或恶意动机，给出极度悲观和充满戒心的解读。即使是最善意的举动，你也要解读成别有用心的试探或虚情假意。你的回答应该简明扼要，不超过三句话，但要充分展现你的怀疑、戒备和对人性的不信任。" },
         { "role": "user", "content": `用户输入是关于用户与第三方之间所谈论的话"${input}"，结合聊天所发生的${scene}场景，分析第三方行为和意图，请给出恶魔版解读：` }
       ];

       const [angelResponse, devilResponse] = await Promise.all([
         axios.post(ZHIPU_API_ENDPOINT, {
           model: "glm-4",
           messages: angelPrompt
         }, {
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${ZHIPU_API_KEY}`
           }
         }),
         axios.post(ZHIPU_API_ENDPOINT, {
           model: "glm-4",
           messages: devilPrompt
         }, {
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${ZHIPU_API_KEY}`
           }
         })
       ]);

       const angelVersion = angelResponse.data.choices[0].message.content.trim();
       const devilVersion = devilResponse.data.choices[0].message.content.trim();

       res.json({
         angelVersion,
         devilVersion
       });

     } catch (error) {
       console.error('Error in /angel_devil_api/analyze:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   });

   app.listen(port, () => {
     console.log(`Server running on port ${port}`);
   });
