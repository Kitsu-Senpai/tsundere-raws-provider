const {retrieveSearchUserPage} = require('./nyaa.js');
const {HttpRequest} = require('http-request');
const {Torrent} = require('torrent');
const {FFmpeg} = require('ffmpeg');
const {FileSystem} = require('file-system');

const user = "Tsundere-Raws";
const minSeeders = 10;

const episodes = [];

/**
 * Retrieve an anime episode.
 * @param episode The episode number to retrieve (1, 2, 3, ...).
 * @returns {Promise<boolean>} True if the episode was found.
 */
async function retrieveEpisode(episode) {
    const results = [];

    for (let page = 1; page <= 5; page++) {
        const entries = await retrieveSearchUserPage(user, title, page);
        for (const entry of entries) {
            const entryTitle = HttpRequest.htmlDecode(entry.title);
            const result = match(entryTitle, regex);
            if (result.length <= 2) {
                continue;
            }

            if (parseInt(result[1]) !== parseInt(season)) {
                continue;
            }
            if (parseInt(result[2]) !== episode) {
                continue;
            }
            results.push(entry);
        }

        // Delay to avoid being blocked
        delay(1000);
    }

    for (const entry of results) {
        if (entry.seeders < minSeeders) {
            continue;
        }
        episodes.push(entry);
    }

    // Sort by seeders
    episodes.sort((a, b) => b.seeders - a.seeders);

    return episodes.length > 0;
}

/**
 * Download the anime episode.
 * @returns {Promise<void>} The promise.
 */
async function downloadEpisode() {
    if (episodes.length === 0) {
        error("No episode to download");
        throw new Error("No episode to download");
    }

    const entry = episodes[0];

    const torrentFile = tempDir + "/download.torrent";
    await HttpRequest.downloadFile(entry.torrent, torrentFile);
    await Torrent.download(torrentFile, tempDir);

    // Find the video file (.mkv)
    const files = FileSystem.getFiles(tempDir, "*.mkv");
    if (files.length === 0) {
        error("No video file found");
        throw new Error("No video file found");
    }

    const videoFile = files[0];
    FileSystem.move(videoFile, tempDir + "/input.mkv");

    const outputFile = tempDir + "/output.mp4";
    const command = "-i input.mkv -vf subtitles=input.mkv -metadata title=Onigami \"" + outputFile + "\"";
    await FFmpeg.encode(tempDir, command);
}