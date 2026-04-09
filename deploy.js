require("dotenv").config();
const ftp = require("basic-ftp");
const path = require("path");

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });

    const remotePath = process.env.FTP_REMOTE_PATH || "/www";
    await client.ensureDir(remotePath);
    await client.clearWorkingDir();

    const filesToUpload = ["index.html"];
    for (const file of filesToUpload) {
      const localPath = path.join(__dirname, file);
      await client.uploadFrom(localPath, file);
      console.log(`Uploaded: ${file}`);
    }

    console.log("Deploy complete!");
  } catch (err) {
    console.error("Deploy failed:", err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
