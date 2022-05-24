import {Message, Client, CacheType, CommandInteraction} from 'discord.js';

import {createDummyServer} from './dummyServer.js';
import {fetchUserData, authorizeToGithub, inviteUser} from './githubCommands.js';

import {clicheBotConfig, networkConfig} from './configHandler.js';
import {githubCommandName, registerSlashCommands, rollDiceCommandName} from './commandRegister.js';
import {existsWikipediaUrl, expandWikipediaUrlToData} from './wikipediaExpander.js';

const LABO_GUILD_ID = '947390529145032724';

authorizeToGithub(clicheBotConfig.githubPat);

createDummyServer(networkConfig.port);

registerSlashCommands(
    clicheBotConfig.discordToken, clicheBotConfig.botClientId);

const client = new Client({
  intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
});

client.once('ready', () => {
  console.log('Ready!');
  console.log(client.user?.tag ?? 'undefined user');
});

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;
});

const githubCommandProc = async (
    interaction: CommandInteraction<CacheType>) => {
  const userName = interaction.options.getString('github_username');
  if (!userName) return;

  const invitedUser = await fetchUserData(userName);
  if (!invitedUser) {
    console.log('invalid user');
    interaction.reply(`${userName}は存在しないGithubアカウントです。`);
    return;
  }

  const invitationResponse = await inviteUser(invitedUser?.id);

  if (!invitationResponse) {
    interaction.reply(`${userName}の招待に失敗しました。すでにメンバーになっている可能性があります。`);
    return;
  }

  interaction.reply(`${userName}を組織に招待しました。`);
};

const wikipediaCommandProc = async (message: Message) => {
  if (!(await existsWikipediaUrl(message.content))) {
    return;
  }

  const summaries = await expandWikipediaUrlToData(message.content);
  if (!summaries || summaries.length === 0) {
    return;
  }

  message.reply({embeds: summaries.map((summary) => ({
    author: {
      name: 'Wikipedia',
      url: summary.url,
      icon_url: 'https://media.snl.no/media/36894/standard_Wikipedia-logo-v2.png',
    },
    title: summary.title,
    url: summary.url,
    description: summary.summary,
    image: {
      url: summary.thumbnailUrl,
    },
  }))});
};

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  // eslint-disable-next-line max-len
  console.log(`interaction occured on ${interaction.guild?.name} : ${interaction.guildId}`);
  if (interaction.guildId === LABO_GUILD_ID) {
    console.log('You\'re on Yurugengo Labo');
  }

  const {commandName} = interaction;

  if (commandName === githubCommandName) {
    githubCommandProc(interaction);
  }

  if (commandName === rollDiceCommandName) {
    const diceNumber = interaction.options.getInteger('dice_number') ?? 4;
    const diceSide = interaction.options.getInteger('dice_side') ?? 6;
    const results = [...Array(diceNumber)].map(() => Math.floor(Math.random() * diceSide) + 1);
    const elementsStr = results.reduce((acc, item) => `${acc ? acc + ', ' : ''}${item}`, '');
    const elementsSum = results.reduce((acc, item) => acc + item, 0);
    const message = `${elementsStr} : ${elementsSum}`;

    interaction.reply(message);
  }
});

client.on('message', async (message) => {
  if (message.guildId === LABO_GUILD_ID) {
    // ここに実験用のコードを書く
  }

  await wikipediaCommandProc(message);
});

client.login(clicheBotConfig.discordToken);
