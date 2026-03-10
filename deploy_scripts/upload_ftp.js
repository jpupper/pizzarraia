const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

async function syncLocalToRemote(client, localFolder, remoteFolder) {
    await client.ensureDir(remoteFolder);

    // Obtenemos la lista de archivos remotos
    const remoteList = await client.list();
    const remoteMap = new Map();
    for (const item of remoteList) {
        remoteMap.set(item.name, item);
    }

    // Leemos los archivos de tu carpeta local
    const localItems = fs.readdirSync(localFolder);

    for (const item of localItems) {
        const localPath = path.join(localFolder, item);
        const stat = fs.statSync(localPath);

        if (stat.isDirectory()) {
            await syncLocalToRemote(client, localPath, `${remoteFolder}/${item}`);
            await client.cd(remoteFolder);
        } else {
            const remoteItem = remoteMap.get(item);

            if (!remoteItem || remoteItem.size !== stat.size) {
                console.log(`[SUBIENDO] ${remoteFolder}/${item}`);
                await client.uploadFrom(localPath, item);
            }
        }
    }
}

async function uploadToFtp() {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    // Ojo: Si configuras estas variables en tu archivo .env algún día, puedes llamarlas desde process.env
    const ftpHost = 'c1700065.ferozo.com';
    const ftpUser = 'jpupper@jeyder.com.ar';
    const ftpPassword = 'Sarosa2025';

    try {
        console.log('--- Iniciando conexion FTP inteligente ---');
        console.log('Comparando tamanios de archivos... Solo subiendo lo modificado o nuevo.');

        await client.access({
            host: ftpHost,
            user: ftpUser,
            password: ftpPassword,
            secure: false
        });

        const remoteDir = '/pizzarraia';
        // COMO EL ARCHIVO AHORA ESTÁ EN UNA SUBCARPETA, BUSCAMOS EL PUBLIC UN NIVEL ARRIBA '..'
        const localPublicFolder = path.join(__dirname, '../public');

        await syncLocalToRemote(client, localPublicFolder, remoteDir);

        console.log('==========================================');
        console.log('¡Sincronizacion FTP completada con exito!');
        console.log('==========================================');

    } catch (err) {
        console.error('Ocurrio un error en la subida FTP:', err);
    } finally {
        client.close();
    }
}

uploadToFtp();
