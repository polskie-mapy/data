const fs = require('fs');
const round = require('./lodash.round');

if (!fs.existsSync('./data.json')) {
    console.error('data.json not found');

    return 1;
}

const renderCsv = function(data, extraHeaders = []) {
    const inlineData = (item) => {
        if (typeof item === 'string') {
            return '"' + item
                .replaceAll('\n', '\\n')
                .replaceAll("\"", "\"\"")
                .replace(/^=/, "'=")
                .replace(/^-/, "'-")
                .replace(/^\+/, "'+")
                + '"'
            ;
        }
        if (typeof item === 'number') {
            return item;
        }
        if (typeof item === 'boolean') {
            return item ? 'yes' : 'no';
        }
        if (typeof item === 'undefined' || item === null) {
            return '';
        }
    }

    const header = Array.from(new Set([...Object.keys(data[0]), ...extraHeaders]).values()).join(",");
    const values = data.map(item => Object.values(item).map(inlineData).join(","));

    return [header, ...values].join("\n");
}

const generateColumnType = (link, i) => {
    return `link${i + 1}`;
}

const escapeXml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const toValidIsoZulu = (value) => {
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
        return null;
    }

    return new Date(value).toISOString();
};

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const renderSitemap = (entries) => {
    const urls = entries.map((entry) => {
        const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';

        return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
};

const generateColumns = function (points) {
    const columns = points.reduce((acc, cur) => {
        const columns =
            Object.fromEntries(
                cur.links.map(
                    (link, i) => [generateColumnType(link, i), 1]
                )
            );

        return {
            ...acc,
            ...columns
        }
    }, {});

    return Object.keys(columns);
}

function coord2Dms(coord, winds) {
    if (typeof coord !== 'number') throw TypeError('number expected');

    const absDegrees = Math.abs(coord);
    const floorAbsDegrees = Math.floor(coord);
    const sign = Math.sign(coord);
    const degrees = sign * floorAbsDegrees;
    const minutes = Math.floor(60 * (absDegrees - floorAbsDegrees));
    const seconds = 3600 * (absDegrees - floorAbsDegrees) - 60 * minutes;
    const wind = sign >= 0 ? winds[0] : winds[1];

    return `${degrees}°${round(minutes, 3)}'${round(seconds, 3)}"${wind}`;
}

function coords2Dms(coords) {
    const winds = [['E', 'W'], ['N', 'S']];

    return coords.map(coord => coord2Dms(coord, winds.pop())).join(' ');
}

function coords2GmapsPin(coords) {
    const loc = coords.join(',');
    const placePin = encodeURIComponent(coords2Dms(coords));
    const zoom = 17;

    return `https://www.google.com/maps/place/${placePin}/@${loc},${zoom}z`;
}

const data = require(process.cwd() + '/data.json');
const sitemapBaseUrl = 'https://mapainternetow.pl';
const sitemapPointUrlTemplate = `${sitemapBaseUrl}/maps/{mapId}/point/{pointId}`;

fs.mkdirSync('./dist/maps', { recursive: true });

data.maps.forEach(map => {
    const file = `./dist/maps/${map.id}/points.json`;
    const points = data.points.filter(point => point.mapId === map.id);
    const content = JSON.stringify(points);

    fs.mkdirSync(`./dist/maps/${map.id}`, { recursive: true });
    fs.writeFileSync(file, content);
});

const buildTimestamp = new Date().toISOString();
const mapsWithMetadata = data.maps.map((map) => {
    const points = data.points.filter((point) => point.mapId === map.id);
    const mostRecentNewPointAddedAt = points
        .map((point) => point.createdAt)
        .filter((createdAt) => typeof createdAt === 'string' && Number.isFinite(Date.parse(createdAt)))
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;

    return {
        ...map,
        lastUpdatedAt: buildTimestamp,
        mostRecentNewPointAddedAt,
    };
});

const file = `./dist/maps.json`;
const content = JSON.stringify(mapsWithMetadata);

fs.writeFileSync(file, content);

const mapsIndexed = Object.fromEntries(data.maps.map(map => [map.id, map]));

const sitemapEntries = [
    {
        loc: `${sitemapBaseUrl}/`,
        lastmod: buildTimestamp,
    },
    ...data.points.map((point) => ({
        loc: sitemapPointUrlTemplate
            .replaceAll('{mapId}', String(point.mapId))
            .replaceAll('{pointId}', String(point.id)),
        lastmod: toValidIsoZulu(point.createdAt),
    })),
];

fs.writeFileSync(
    `./dist/sitemap.xml`,
    renderSitemap(sitemapEntries)
);

fs.writeFileSync(
    `./dist/points.csv`,
    renderCsv(
        data.points.map(
            point => ({
                mapId: point.mapId,
                mapName: mapsIndexed[point.mapId].name,
                pointId: point.id,
                title: point.title,
                excerpt: point.excerpt,
                assumedCoords: point.assumedCoords,
                tags: point.tags.map((tag) => tag.title).join(","),
                coords: point.coords.join(", "),
                gmapsUrl: coords2GmapsPin(point.coords),
                createdAt: point.createdAt,
                ...Object.fromEntries(
                    point.links.map((link, i) => [generateColumnType(link, i), link.url])
                ),
            })
        ),
        generateColumns(data.points)
    )
);
