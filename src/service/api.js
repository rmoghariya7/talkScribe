import axios from "axios";

const apiCall = (method, url, params = "", reqHeaders = {}) => {
  return new Promise((resolve, reject) => {
    axios({
      method,
      url,
      headers: reqHeaders,
      data: params,
    })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const transcribe = async (file) => {
  const formData = new FormData();
  formData.append("audio", file);
  const response = await apiCall(
    "POST",
    "http://10.40.1.158:3000/api/transcription/upload",
    formData,
    {
      "Content-Type": "multipart/form-data",
    }
  );
  const data = await response.json();
  return data;
};

export default transcribe;
