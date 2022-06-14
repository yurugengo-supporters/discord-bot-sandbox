import express from 'express';

// GAEがサーバーをリスンしていないとそもそもアプリとして認識してくれないので、ダミーのレスポンスを返すようにしておく
export const createDummyServer = (port: number) => {
  const PORT = port;
  const app = express();
  app.get('/', (_req, res) => {
    res.send('🤖Bot is running!!🤖');
  });

  // GAEで最小インスタンス数を指定するには、Warmup Endpoint を有効にする必要がある
  app.get('/_ah/warmup', (_req, res) => {
    res.sendStatus(200);
  });

  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
};


