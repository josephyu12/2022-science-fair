import os
from pydub import AudioSegment

import numpy as np
import tensorflow as tf
import datetime

import tensorflow_io as tfio
from pydub import AudioSegment

def decode_audio(audio_binary):
  audio, _ = tf.audio.decode_wav(contents=audio_binary)
  return tf.squeeze(audio, axis=-1)

def get_label(file_path):
  parts = tf.strings.split(
      input=file_path,
      sep=os.path.sep)
  return parts[-2]

def get_waveform_and_label(file_path):
  label = get_label(file_path)
  audio_binary = tf.io.read_file(file_path)
  waveform = decode_audio(audio_binary)
  return waveform, label

def three_channels(spectrogram, label_id):
  spectrogram = tf.squeeze(spectrogram)
  width, height = (125, 128)
  dim = tf.zeros((width, height))
  spectrogram = tf.stack((dim, spectrogram, dim), axis=2)
  return spectrogram, label_id

def make_spectrogram(waveform):
  input_len = 32000
  waveform = waveform[:input_len]
  zero_padding = tf.zeros(
      [input_len] - tf.shape(waveform),
      dtype=tf.float32)
  waveform = tf.cast(waveform, dtype=tf.float32)
  equal_length = tf.concat([waveform, zero_padding], 0)
  spectrogram = tfio.audio.spectrogram(equal_length, nfft = 2048, window = 512, stride = 256)
  mel_spectrogram = tfio.audio.melscale(
    spectrogram, rate=16000, mels=128, fmin=0, fmax=8000)  
  dbscale_mel_spectrogram = tfio.audio.dbscale(
    mel_spectrogram, top_db=80)
  dbscale_mel_spectrogram = dbscale_mel_spectrogram[..., tf.newaxis]
  return dbscale_mel_spectrogram

def get_spectrogram_and_label_id(audio, label):
  spectrogram = make_spectrogram(audio)
  label_id = tf.argmax(label == ["real", "fake"])
  return spectrogram, label_id

def normalize_ds(spectrogram, label_id):
    spectrogram = spectrogram + abs(tf.math.reduce_min(spectrogram))
    spectrogram = spectrogram / tf.math.reduce_max(spectrogram)
    return spectrogram, label_id

def preprocess_dataset(files):
  AUTOTUNE = tf.data.AUTOTUNE

  new_files = []

  for i in files:
    root_ext = os.path.splitext(i)
    if root_ext[1] != ".wav":
      track = AudioSegment.from_file(root_ext[0] + root_ext[1], format=root_ext[1].replace(".", ""))
      track.export(root_ext[0] + '.wav', format='wav')
      new_files.append(root_ext[0] + '.wav')
    else:
      new_files.append(i)
    
  files_ds = tf.data.Dataset.from_tensor_slices(new_files)
  waveform_ds = files_ds.map(
      map_func=get_waveform_and_label,
      num_parallel_calls=AUTOTUNE)
  spectrogram_ds = waveform_ds.map(
      map_func=get_spectrogram_and_label_id,
      num_parallel_calls=AUTOTUNE)
  spectrogram_ds = spectrogram_ds.map(
      map_func=three_channels,
      num_parallel_calls=AUTOTUNE)
  output_ds = spectrogram_ds.map(
      map_func=normalize_ds,
      num_parallel_calls=AUTOTUNE)

  output_ds = output_ds.cache().prefetch(AUTOTUNE)
  
  num_elements = tf.data.experimental.cardinality(output_ds).numpy()

  output_ds = output_ds.shuffle(num_elements)
    
  return output_ds

import flask
from flask import jsonify
from flask_cors import CORS, cross_origin
import pickle

# Use pickle to load in the pre-trained model.
with open(f'/Users/joseph/Desktop/tensorflow-test/deploymodel3.pkl', 'rb') as f:
    model = pickle.load(f)

app = flask.Flask(__name__, template_folder='templates')
CORS(app)
@app.route('/',methods=['GET','POST'])
#app.config['CORS_HEADERS'] = 'Content-Type'

######################################

#@cross_origin(origins="http://localhost:3000")
def main():
    # print(flask.request.data)
    # print(flask.request.files)
    
    if flask.request.method == 'GET':
        return(flask.render_template('index.html'))
    if flask.request.method == 'POST':
        audio = flask.request.files['audio']
        #audio = flask.request.data
        # ct = datetime.datetime.now()
        # audio_path = "./audiofiles/" +  str(ct) + '.wav'
        audio_path = "./audiofiles/" + audio.filename
        audio.save(audio_path)

        sound = AudioSegment.from_wav(audio_path)
        if sound.channels>1:
          print('*** remove multiple channels ***')
          sound = sound.set_channels(1)
        sound.export(audio_path, format="wav")

        preprocessed = preprocess_dataset([audio_path])

        preprocessed = preprocessed.batch(1)

        for image, _ in preprocessed:
            prediction = model.predict(image)
            if prediction < 0.5:
                pred = 'Human/Real'
                confidence = format(np.squeeze(1 - prediction), '.3f')
            if prediction >= 0.5:
                pred = 'Synthetic/Fake'
                confidence = format(np.squeeze(prediction), '.3f')
            # return jsonify({
            #   "prediction":pred,
            #   "confidence":confidence
            # })
            return flask.render_template('index.html', prediction=pred, confidence = confidence)

if __name__ == '__main__':
    app.run(debug=True)