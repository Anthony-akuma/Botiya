module.exports = {
    name: 'spam',
    desc: 'Spams the given text a specified number of times.',
    dmUser: true, // Allow DM use
    
    permission: 0, // Default permission level, adjust as needed
    run: async ({ m, args }) => {
        // Check if the arguments provided are valid
        if (args.length < 2) {
            return m.reply('Usage: !spam {text} {number_of_times}');
        }

        // Extract the number and the text
        const count = parseInt(args.pop());  // The last argument is the number of times to spam
        const text = args.join(' ');  // All other arguments are considered as the message to spam

        if (isNaN(count) || count <= 0) {
            return m.reply('Please provide a valid positive number for how many times to spam.');
        }

        if (!text) {
            return m.reply('Please provide text to spam.');
        }

        // Spam the text `count` times, one message per second
        let currentCount = 0;
        const interval = setInterval(() => {
            if (currentCount < count) {
                m.reply(text);
                currentCount++;
            } else {
                clearInterval(interval); // Stop once we reach the desired count
            }
        }, 1000); // Sends a message every second
    },
};