require('dotenv').config(); // Cargar las variables de entorno desde el archivo .env
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');

// Crear una nueva instancia del cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Crear una instancia del reproductor de música
const player = new Player(client);

// Prefijo del bot
const prefix = '%';

// Evento cuando el bot está listo
client.once('ready', () => {
    console.log(`${client.user.tag} está en línea!`);
});

// Evento para manejar los mensajes
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Comando para reproducir música
    if (command === 'play') {
        if (!args[0]) return message.reply('Debes proporcionar un enlace o nombre de la canción!');
        const query = args.join(' ');
        const queue = player.createQueue(message.guild, { metadata: { channel: message.channel } });

        try {
            await queue.connect(message.member.voice.channel);
        } catch {
            queue.destroy();
            return message.reply('No puedo unirme al canal de voz!');
        }

        const track = await player.search(query, {
            requestedBy: message.author
        }).then(x => x.tracks[0]);

        if (!track) return message.reply('No se encontró ninguna canción.');

        queue.play(track);
        message.channel.send(`Reproduciendo: **${track.title}**`);
    }

    // Comando para detener la música
    if (command === 'stop') {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.reply('No hay ninguna música sonando.');
        queue.destroy();
        message.channel.send('La música se ha detenido.');
    }

    // Comando para saltar a la siguiente canción
    if (command === 'skip') {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.reply('No hay ninguna música sonando.');
        queue.skip();
        message.channel.send('Canción saltada!');
    }

    // Comando para repetir la canción actual
    if (command === 'repeat') {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.reply('No hay ninguna música sonando.');
        queue.setRepeatMode(1);
        message.channel.send('Canción en modo repetición!');
    }

    // Comando para cambiar el volumen
    if (command === 'volume') {
        const volume = parseInt(args[0]);
        const queue = player.getQueue(message.guild);
        if (!queue || isNaN(volume)) return message.reply('Por favor ingresa un número válido para el volumen.');
        queue.setVolume(volume);
        message.channel.send(`Volumen establecido en ${volume}`);
    }

    // Comando de ayuda
    if (command === 'help') {
        message.channel.send(`
**Comandos disponibles**:
\`%play [nombre o enlace]\` - Reproduce una canción.
\`%stop\` - Detiene la música.
\`%skip\` - Salta a la siguiente canción.
\`%repeat\` - Repite la canción actual.
\`%volume [número]\` - Ajusta el volumen de la música.
        `);
    }
});

// Iniciar el bot con el token de la variable de entorno
client.login(process.env.DISCORD_TOKEN);
