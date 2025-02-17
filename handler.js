const fs = require('fs');
const path = require('path');
const gradient = require('gradient-string');
const config = require('./config.json');

global.owner = config.owner || [];
global.prefix = config.prefix || '/';
global.botName = config.botName || 'Bot';
global.commands = new Map();
global.events = new Map();
global.cc = {};
const cooldowns = new Map();

const commandsFolder = path.resolve(__dirname, './scripts/cmds');
const eventsFolder = path.resolve(__dirname, './scripts/events');

const gradients = {
    lime: gradient('#32CD32', '#ADFF2F'),
    cyan: gradient('#00FFFF', '#00BFFF'),
    instagram: gradient(['#F58529', '#DD2A7B', '#8134AF', '#515BD4']),
};

const logInfo = (message) => console.log(gradients.lime(message));
const logSuccess = (message) => console.log(gradients.cyan(message));
const logError = (message) => console.log(gradients.instagram(message));

const loadCommands = () => {
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
    let commandNames = [];

    commandFiles.forEach(file => {
        const command = require(path.join(commandsFolder, file));
        if (command.name && typeof command.run === 'function') {
            global.commands.set(command.name, command);
            commandNames.push(command.name);
        }
    });

    // Log command names
    logInfo("[Info] Command Names:");
    commandNames.forEach(name => logInfo(` - ${name}`));

    // Log success message with the count of loaded commands
    logSuccess(`[Success] ${commandNames.length} Commands loaded successfully`);
};

global.cc.reloadCommand = function (commandName) {
    try {
        const commandPath = path.join(commandsFolder, `${commandName}.js`);
        if (!fs.existsSync(commandPath)) {
            logError(`Command [${commandName}] does not exist.`);
            return false;
        }
        delete require.cache[require.resolve(commandPath)];
        const reloadedCommand = require(commandPath);
        if (reloadedCommand.name && typeof reloadedCommand.run === 'function') {
            global.commands.set(reloadedCommand.name, reloadedCommand);
            logSuccess(`Command [${commandName}] reloaded successfully.`);
            return true;
        } else {
            logError(`Invalid structure for command [${commandName}].`);
            return false;
        }
    } catch (error) {
        logError(`Failed to reload command [${commandName}]: ${error.message}`);
        return false;
    }
};

const loadEvents = () => {
    const eventFiles = fs.readdirSync(eventsFolder).filter(file => file.endsWith('.js'));
    eventFiles.forEach(file => {
        const event = require(path.join(eventsFolder, file));
        if (event.name && typeof event.event === 'function') {
            global.events.set(event.name, event);
            logSuccess(`Loaded event: ${event.name}`);
        }
    });
};

// Updated permission system
const hasPermission = (m, sender, permission) => {
    if (permission === 0) return true; // All users can access
    if (permission === 1 && (m.isGroup && (m.isAdmin || global.botadmin.includes(sender)))) return true; // Group admins and bot admins can access
    if (permission === 2 && global.botadmin.includes(sender)) return true; // Only bot admins can access
    return false;
};

const canExecuteInDM = (cmd, sender) => {
    if (cmd.dmUser) return true;
    if (global.owner.includes(sender)) return true;
    return false;
};

// Display "Bot Connected" on Start
console.log(gradient.rainbow("\n========== Bot Connected ==========\n"));

module.exports = async (sock, m) => {
    try {
        const body = (
            m.mtype === 'conversation' && m.message.conversation ||
            m.mtype === 'imageMessage' && m.message.imageMessage.caption ||
            m.mtype === 'documentMessage' && m.message.documentMessage.caption ||
            m.mtype === 'videoMessage' && m.message.videoMessage.caption ||
            m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text ||
            m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId ||
            m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId
        ) || '';

        const sender = m.key.fromMe
            ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
            : m.key.participant || m.key.remoteJid;

        const botNumber = await sock.decodeJid(sock.user.id);
        const isGroup = m.key.remoteJid.endsWith('@g.us');
        const isCmd = body.startsWith(global.prefix);
        const command = isCmd ? body.slice(global.prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);

        // Logging the structured message info
        logInfo(`[Info] Message sent by: ${sender}`);
        logInfo(`       Message: ${body}`);
        logInfo(`       Replied to: ${m.message?.contextInfo?.quotedMessage ? sender : "null"}`);
        logInfo(`       In Group: ${isGroup}`);
        if (isGroup) logInfo(`       Group ID: ${m.key.remoteJid}`);
        logInfo(`       Time: ${new Date().toLocaleString()}`);

        // Check if message is a reaction
        if (m.mtype === 'reactionMessage') {
            logInfo(`[Info] Reacted ${m.message.reactionMessage.emoji} by ${sender}`);
        }

        if (isCmd && global.commands.has(command)) {
            const cmd = global.commands.get(command);

            if (!isGroup && !canExecuteInDM(cmd, sender)) {
                return await sock.sendMessage(
                    m.key.remoteJid,
                    { text: `The command "${cmd.name}" cannot be executed in private messages. Please use it in a group chat.` },
                    { quoted: m }
                );
            }

            if (!hasPermission(m, sender, cmd.permission)) {
                return await sock.sendMessage(
                    m.key.remoteJid,
                    { text: `You don't have permission to use "${cmd.name}".` },
                    { quoted: m }
                );
            }

            const now = Date.now();
            if (!cooldowns.has(command)) cooldowns.set(command, new Map());
            const timestamps = cooldowns.get(command);
            const cooldownAmount = (cmd.cooldowns || 5) * 1000;

            if (timestamps.has(sender)) {
                const expirationTime = timestamps.get(sender) + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                    return await sock.sendMessage(
                        m.key.remoteJid,
                        { text: `You're using "${command}" too fast. Wait ${timeLeft}s.` },
                        { quoted: m }
                    );
                }
            }

            timestamps.set(sender, now);
            setTimeout(() => timestamps.delete(sender), cooldownAmount);

            logSuccess(`${sender} executed: ${command}`);
            await cmd.run({ sock, m, args, sender, botNumber });
        } else if (isCmd) {
            await sock.sendMessage(
                m.key.remoteJid,
                { text: `The command you used "${command}" is not found, try to command ${global.prefix}help to see all commands.` },
                { quoted: m }
            );
        }

        global.events.forEach(event => {
            event.event({ sock, m, sender });
        });
    } catch (err) {
        logError(`Error: ${err.message}`);
    }
};

fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename);
    logInfo(`Updated ${__filename}`);
    delete require.cache[__filename];
    require(__filename);
});

loadCommands();
loadEvents();