const fs = require('fs');

if (!fs.existsSync('./data.json')) {
    console.error('data.json not found');

    return 1;
}

const data = require(process.cwd() + '/data.json');

fs.mkdirSync('./dist/maps', { recursive: true });

data.maps.forEach(map => {
    const file = `./dist/maps/${map.id}/points.json`;
    const content = JSON.stringify(
        data.points.filter(point => point.mapId === map.id)
    );
    fs.mkdirSync(`./dist/maps/${map.id}`, { recursive: true });
    fs.writeFileSync(file, content);
});

const file = `./dist/maps.json`;
const content = JSON.stringify(data.maps);

fs.writeFileSync(file, content);