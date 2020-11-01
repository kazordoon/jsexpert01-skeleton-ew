#!/bin/bash

ASSETS_DIRECTORY="assets/timeline"

function convert() {
  ffmpeg -y -i $1 \
    -c:a aac -ac 2 \
    -vcodec h264 -acodec aac \
    -ab 128k \
    -movflags frag_keyframe+empty_moov+default_base_moof \
    -b:v $3 \
    -maxrate $3 \
    -bufsize $4 \
    -vf "scale=$5" \
    -v quiet \
    $2
}

for mediaFile in $(ls $ASSETS_DIRECTORY | grep .mp4); do
  # Cortar extensão e resolução do arquivo
  FILENAME=$(echo $mediaFile | sed -n 's/.mp4//p' | sed -n 's/-1920x1080//p')
  INPUT="$ASSETS_DIRECTORY/$mediaFile"
  TARGET_DIRECTORY="$ASSETS_DIRECTORY/$FILENAME"

  mkdir -p $TARGET_DIRECTORY

  # Criar arquivos com resoluções diferentes em seus respectivos diretórios
  OUTPUT="$ASSETS_DIRECTORY/$FILENAME/$FILENAME"
  DURATION=$(ffprobe -i $INPUT -show_format -v quiet | sed -n 's/duration=//p')

  OUTPUT144="$OUTPUT-$DURATION-144.mp4"
  BITRATE144="300k"
  BUFSIZE144="400k"
  SCALE144="256:144"

  OUTPUT360="$OUTPUT-$DURATION-360.mp4"
  BITRATE360="400k"
  BUFSIZE360="400k"
  SCALE360="-1:360"

  OUTPUT720="$OUTPUT-$DURATION-720.mp4"
  BITRATE720="1500k"
  BUFSIZE720="1000k"
  SCALE720="-1:720"

  echo '========================================='
  echo "$INPUT"
  echo '========================================='

  echo 'Rendering in 720p'
  convert $INPUT $OUTPUT720 $BITRATE720 $BUFSIZE720 $SCALE720

  echo 'Rendering in 360p'
  convert $INPUT $OUTPUT360 $BITRATE360 $BUFSIZE360 $SCALE360

  echo 'Rendering in 144p'
  convert $INPUT $OUTPUT144 $BITRATE144 $BUFSIZE144 $SCALE144

  echo -e "\n"
done
