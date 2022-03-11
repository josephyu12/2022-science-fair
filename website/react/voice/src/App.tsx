/* eslint-disable no-lone-blocks */
import React from 'react'
import { useState } from 'react'
import "antd/dist/antd.css";
import './App.css'
import { Button, Divider } from 'antd'
import axios from 'axios'
// @ts-ignore
import AudioReactRecorder, { RecordState } from 'audio-react-recorder'

function App() {
  const [record,setRecord]=useState<RecordState>(null)
  const [message,setMessage]=useState<string>('')
  return (
    <div className="App">
        
        <h1 style={{marginTop:'0.5em', fontSize:'36px'}}>
          Speech Classifier
        </h1>
        <AudioReactRecorder state={record} onStop={
          (data:any)=>{
            console.log(data)
            const formData = new FormData()
            formData.append('audio', new File([data.blob],"file.wav"))
            
            axios.post('http://127.0.0.1:5000/', formData, {
              headers: { "Content-Type": "multipart/form-data","crossDomain": "true" }
            }
            ).then((response)=>{
              console.log(response)
              setMessage('Prediction: '+ response.data.prediction + ' ('+ response.data.confidence + ' Probability)')
              
            }).catch(error=>console.error)
          }

        } />
        <br></br>
 
        <Button type="primary" onClick={
          ()=>setRecord(RecordState.START)
        }>Start</Button>
        <Button type="primary" style={{marginLeft:'1em'}} onClick={
          ()=>{
            setRecord(RecordState.STOP)
          }
        }>Stop</Button>

        <Divider />

        <h2>Alternatively, you can upload a file:</h2>

        <form style={{marginTop:'1em'}} className="text-center" action='/' method="POST" encType="multipart/form-data">
            <div style={{marginLeft:'7.8em'}}>
              <input className="form-control center"  onChange={
              (e: React.ChangeEvent<HTMLInputElement>)=>{
                console.log(e.target.files)
                if (e.target.files && e.target.files.length>0){
                  console.log(e.target.files[0])
                  const formData = new FormData()
                  formData.append('audio', e.target.files[0])
                  
                  axios.post('http://127.0.0.1:5000/', formData, {
                    headers: { "Content-Type": "multipart/form-data","crossDomain": "true" }
                  }
                  ).then((response)=>{
                    console.log(response)
                    setMessage('Prediction: '+response.data.prediction + ' ('+response.data.confidence + ') Probability')
                    
                  }).catch(error=>console.error)
  
                }
              }} type="file" name="audio" /></div>
            
        </form>
        <Divider />
        {message !== '' &&
        <h2 style={{border: '4px solid #3FA9FF', display: 'inline', padding: '0.3em'}}>{message}</h2>
        }   
        </div>
  );
}

export default App;





























        {/* <ReactMic
          record={record}
          className="sound-wave"
          onStop={
            (blob:any)=>{
              console.log(blob)
              fileDownload(blob.blob,'wavefile.wav')
            }
            
          }
          onData={
            (blob:any)=>{ console.log('chunk of real-time data is: ', blob)}
          }
          strokeColor="#000000"
          backgroundColor="#FF4081"
          mimeType={'audio/wav'} />
        <button onClick={
          ()=>{setRecord(true)}
        } type="button">Start</button>
        <button onClick={
          ()=>{setRecord(false)
          }
        } type="button">Stop</button> */}

        {/* <Recorder
        record={true}
        title={"New recording"}
        audioURL={audioDetails.url}
        showUIAudio
        handleAudioStop={(data:AudioDetails) =>{  
          console.log(data)
          setAudioDetails( data )
        }}
        handleAudioUpload={(data:any): void => {
          console.log(data)
          // fileDownload(data,'wavefile.wav')
          // data.type='audio/wave'
          console.log(data.type)
          const formData = new FormData()
          formData.append('audio', new File([data],"file.wav"))
          formData.append('Lijian','12345')
          // fetch('http://localhost:5000/', {
          //   mode: 'cors' ,
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'multipart/form-data'
          //     // 'Content-Type': 'application/x-www-form-urlencoded',
          //   },
          //   body: formData
          // }).then(res=>res.json()).then(data=>console.log(data))}
          
          axios.post('http://127.0.0.1:5000/', formData, {
            headers: { "Content-Type": "multipart/form-data","crossDomain": "true" }
          })}
        // axios.post('http://127.0.0.1:5000/',{audio:data,testdata:'123'}).then(
        //   res=>{console.log(res)}
        //   ).catch(error=>console.log)
        // }
        }
        handleReset={() => 
          setAudioDetails( {
            url: null,
            blob: null,
            chunks: null,
            duration: {
              h: 0,
              m: 0,
              s: 0
            }
          } )
        }
        mimeTypeToUseWhenRecording={`audio/webm`}
      />
       */}
