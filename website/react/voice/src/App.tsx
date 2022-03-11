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
