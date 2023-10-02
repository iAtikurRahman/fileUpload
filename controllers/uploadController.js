require("dotenv").config();
var AWS = require('aws-sdk');


// -------- AWS Configure Start ------------------ //
// ------------------- Trying AWS Configuration Start ---------------------------- //
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  s3ForcePathStyle: true
});

const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(process.env.AWS_MINIO_ENDPOINT),
  httpOptions: {
    maxSockets: 25,
    agent: false,
    timeout: 1200000,
    connectionTimeout: 1200000
  },
  s3ForcePathStyle: true
});

  const awsFileUpload = async (req, res, file, foldername, userId, contactId)=> {
    // ----- AWS File Upload Start-------------------- //
    return new Promise((resolve, reject) => {
    try {

        // ------ file upload ---------- //
        const bucketName = 'ebs';
        const folderName = foldername; // Desired folder name
      
        const fileName = file.originalname;
        const fileContent = file.buffer;
        
        if (!fileContent) {
          return res.status(400).json({ error: 'File data is missing' });
        }

        const key = `${folderName}/${Date.now()}-${userId}-${contactId}-${fileName}`;
      
        const params = {
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ACL: 'public-read'
        };
      
        s3.upload(params, (err, data) => {
          if (err) {
            console.error('Error uploading image:', err);
            reject(err);
            return res.status(500).json({ error: 'File not uploaded. Please try again 2.' }); 
          }

          let fileLocation = data?.Location;
          if (fileLocation) {
            console.log(fileLocation)
            resolve(fileLocation);
          }else {
            return res.status(500).json({ error: 'File not uploaded. Please try again.' }); 
          }
        });
        
      } catch (error) {
        console.error('Error uploading file:', error.message);
       return res.status(500).json({ error: 'An error occurred while uploading the file' });
      }
    // ----- AWS File Upload End-------------------- //
  })
};

const insertfiles = async (req, res) => {
  const fileSizeLimit = 1024 * 1024 * 1024; // 1024 MB limit

  try {
    if (!req.files || (!req.files['image'] && !req.files['thumbnail'] && !req.files['audio'] && !req.files['video'])) {
      return res.status(400).json({ error: 'At least one of Image, Thumbnail, Audio, or Video is required.' });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Contact ID & User ID is required.' });
    }

    const userId = req.body.userId;
    const contactId = req.body.contactId;
    const images = Array.isArray(req.files['image']) ? req.files['image'] : [req.files['image']];
    const thumbnails = Array.isArray(req.files['thumbnail']) ? req.files['thumbnail'] : [req.files['thumbnail']];
    const audios = Array.isArray(req.files['audio']) ? req.files['audio'] : [req.files['audio']];
    const videos = Array.isArray(req.files['video']) ? req.files['video'] : [req.files['video']];

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : currentMonth;
    const joinedValue = parseInt(`${currentYear}${formattedMonth}`);

    var imageLocations = [];
    var thumbnailLocations = [];
    var audioLocations = [];
    var videoLocations = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      if (image.size > fileSizeLimit) {
        return res.status(400).json({ error: 'Image should be less than 1024MB.' });
      }

      const imageLocationFull = await awsFileUpload(req, res, image, `Visiting_Card/${joinedValue}/Image`, userId, contactId);
      if (imageLocationFull) {
        var imageLocation = imageLocationFull.split('/').slice(5).join('/');
        imageLocations.push(imageLocation);
      } else {
        return res.status(500).json({ error: 'Image upload failed. Please try again later.' });
      }
    }

    for (let i = 0; i < thumbnails.length; i++) {
      const thumbnail = thumbnails[i];

      if (thumbnail.size > fileSizeLimit) {
        return res.status(400).json({ error: 'Thumbnail should be less than 1024MB.' });
      }

      const thumbnailLocationFull = await awsFileUpload(req, res, thumbnail, `Visiting_Card/${joinedValue}/Thumbnail`, userId, contactId);
      if (thumbnailLocationFull) {
        var thumbnailLocation = thumbnailLocationFull.split('/').slice(5).join('/');        
        thumbnailLocations.push(thumbnailLocation);
      } else {
        return res.status(500).json({ error: 'Thumbnail upload failed. Please try again later.' });
      }
    }

    for (let i = 0; i < audios.length; i++) {
      const audio = audios[i];

      if (audio.size > fileSizeLimit) {
        return res.status(400).json({ error: 'Audio should be less than 1024MB.' });
      }

      const audioLocationFull = await awsFileUpload(req, res, audio, `Visiting_Card/${joinedValue}/Audio`, userId, contactId);
      if (audioLocationFull) {
        var audioLocation = audioLocationFull.split('/').slice(5).join('/');
        audioLocations.push(audioLocation);
      } else {
        return res.status(500).json({ error: 'Audio upload failed. Please try again later.' });
      }
    }

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      if (video.size > fileSizeLimit) {
        return res.status(400).json({ error: 'Video should be less than 1024MB.' });
      }

      const videoLocationFull = await awsFileUpload(req, res, video, `Visiting_Card/${joinedValue}/Video`, userId, contactId);
      if (videoLocationFull) {
        var videoLocation = videoLocationFull.split('/').slice(5).join('/');
        videoLocations.push(videoLocation);
      } else {
        return res.status(500).json({ error: 'Video upload failed. Please try again later.' });
      }
    }

    return res.status(200).json({ 
      status: 200,
      message: 'Files uploaded successfully',
      imagePaths: imageLocations,
      thumbnailPaths: thumbnailLocations,
      audioPaths: audioLocations,
      videoPaths: videoLocations
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
};




module.exports = {insertfiles} 