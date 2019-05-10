#!/usr/bin/env node

const {URLSearchParams} = require('url');
const yargs = require('yargs');
const ora = require('ora');
const fetch = require('node-fetch');

const {token, channel} = yargs
  .option('token', {
    alias: 't',
    require: true,
  })
  .option('channel', {
    alias: 'c',
    desc: 'A channel id',
    require: true,
  })
  .help().argv;

const headers = {Authorization: `Bearer ${token}`};
const params = new URLSearchParams();
params.append('channel', channel);
params.append('limit', 100);
const spinner = ora('');
spinner.color = 'green';

const deleteMessage = async data => {
  return fetch('https://slack.com/api/chat.delete', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
  });
};

const clean = async ({count}) => {
  const {ok, error, messages, has_more: hasMore} = await fetch(
    `https://slack.com/api/conversations.history?${params.toString()}`,
    {
      headers,
    },
  ).then(res => res.json());

  if (!ok) {
    throw new Error(error);
  }

  for (const {ts, type, subtype} of messages) {
    count++;
    spinner.prefixText = String(count);
    spinner.text = `Deleting ${subtype || type}...`;
    /* eslint-disable no-await-in-loop */
    await deleteMessage({channel, ts});
    await new Promise(r => setTimeout(r, 250));
    /* eslint-enable no-await-in-loop */
  }

  if (hasMore) {
    await clean({count});
  }
};

(async () => {
  spinner.start();
  await clean({count: 0});
  spinner.succeed();
})().catch(err => {
  spinner.failed();
  spinner.text = err.message;
});
