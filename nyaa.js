const {HttpRequest} = require('http-request');
const {HtmlDocument} = require('html-agility-pack');

const baseUrl = "https://nyaa.si";

/**
 * Represents an entry in Nyaa.si.
 * @class Entry
 * @property {string} title The title of the entry.
 * @property {string} torrent The torrent link.
 * @property {string} seeders The number of seeders.
 */
class Entry {
    constructor(title, torrent, seeders) {
        this.title = title;
        this.torrent = torrent;
        this.seeders = seeders;
    }
}

/**
 * Retrieve the search page.
 * @param search The search query.
 * @param page The page to retrieve.
 * @returns {Promise<Entry[]>} The entries.
 */
export async function retrieveSearchPage(search, page = 1) {
    const path = "?f=0&c=0_0&q=" + HttpRequest.urlEncode(search) + "&p=" + page;
    return await retrievePage(path);
}

/**
 * Retrieve the search page for the user.
 * @param user The user where to search.
 * @param search The search query.
 * @param page The page to retrieve.
 * @returns {Promise<Entry[]>} The entries.
 */
export async function retrieveSearchUserPage(user, search, page = 1) {
    const path = "user/" + user + "?f=0&c=0_0&q=" + HttpRequest.urlEncode(search) + "&p=" + page;
    return await retrievePage(path);
}

/**
 * Retrieve the page and return the entries.
 * @param {string} path The path to retrieve.
 * @returns {Promise<Entry[]>} The entries.
 */
async function retrievePage(path) {
    const response = await HttpRequest.get(baseUrl + "/" + path);

    const doc = new HtmlDocument();
    doc.loadHtml(response);

    const entries = [];

    const nodes = doc.documentNode.selectNodes("//tr[@class='default'] | //tr[@class='success']");
    if (nodes === null || nodes.length === 0) {
        return entries;
    }

    for (const node of nodes) {
        // Get all 'td' nodes
        const tdNodes = node.selectNodes(".//td");

        // Title
        let title = "";
        const titleNode = tdNodes[1];
        const titleLink = titleNode?.selectSingleNode(".//a[@href]");
        if (titleLink) {
            // Check if comment exists
            const titleNodes = titleNode?.selectNodes(".//a[@href]");
            if (titleNodes.length > 1) {
                const commentNode = titleNodes[1];
                title = commentNode?.innerText;
            } else {
                title = titleLink?.innerText;
            }
        }

        // Torrent
        let torrent = "";
        const torrentLinkNode = tdNodes[2];
        const torrentLink = torrentLinkNode?.selectSingleNode(".//a[@href]");
        if (torrentLink !== null) {
            torrent = baseUrl + torrentLink.getAttributeValue("href", "");
        }

        // Seeders
        const seedersNode = tdNodes[5];
        let seeders = seedersNode?.innerText;

        const entry = new Entry(title, torrent, seeders);
        entries.push(entry);
    }
    return entries;
}