import config from "@/config.js";
import axios from "axios";
import retry from "p-retry";

class UnrealService {
  constructor() {
    this.requestQueue = [];
    this.abortTimestamp = Date.now();
    this.canSendRequest = true;
    this.timeout = null;

    document.addEventListener("mousedown", this.onClickStart.bind(this));
    document.addEventListener("touchstart", this.onClickStart.bind(this));
    document.addEventListener("touchend", this.onClickEnd.bind(this));
    document.addEventListener("mouseup", this.onClickEnd.bind(this));
  }

  onClickStart() {
    this.clicking = true;
    clearTimeout(this.timeout);
    const promise = new Promise(() => {
      setTimeout(() => this.requestQueue = this.requestQueue.filter(item => item != promise), 500)
    });

    this.requestQueue.push(promise);
  }

  onClickEnd() {
    this.timeout = setTimeout(() => {
      this.clicking = false;
    }, 100);
  }
  
  abortRequests() {
    this.abortTimestamp = Date.now();
  }

  setProperty(objectPath, propertyName, value, retryCount = 0, sync = false) {
    let requestBody = {
      "ObjectPath": objectPath,
      "PropertyName": propertyName,
      "PropertyValue": value,
      "Access": "WRITE_TRANSACTION_ACCESS"
    };

    const req = this._sendRequest("object/property", requestBody, retryCount, sync).finally(() => {
      setTimeout(() => this.requestQueue = this.requestQueue.filter(item => item != req), 500);
    });

    this.requestQueue.push(req);
    return req;
  }

  getExposedProperties(retryCount = 0, sync = false) {
    return this._sendRequest("exposed", {}, retryCount, sync, "get").then(res => res && res.data);
  }

  getProperty(objectPath, propertyName, retryCount = 0, sync = false) {
    let requestBody = {
      "ObjectPath": objectPath,
      "PropertyName": propertyName,
      "Access": "READ_ACCESS"
    };

    return this._sendRequest("object/property", requestBody, retryCount, sync).then(res => res && res.data);
  }

  callFunction(objectPath, functionName, parameters = {}, retryCount = 10, sync = false, generateTransaction = true) {
    let requestBody = {
      "ObjectPath": objectPath,
      "FunctionName": functionName,
      "Parameters": parameters,
      "GenerateTransaction": generateTransaction
    };

    return this._sendRequest("object/call", requestBody, retryCount, sync).then(res => res && res.data);
  }

  _sendRequest(url, requestBody, retryCount = 0, sync = false, method="put") {
    if (method == "put" && !requestBody.ObjectPath) {
      return new Promise(reject => {
        reject("Empty object path");
      });
    }

    if (!this.canSendRequest && sync && this.clicking) {
      return new Promise(reject => {
        reject("Request rejected since another request is ongoing.");
      });
    }

    let requestTimestamp = Date.now();

    const call = async () => {
      this.canSendRequest = false;
      const options = {
        method: method,
        url: `${config.serverUrl}/remote/${url}`,
        timeout: config.requestTimeout,
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (method == "put") {
        options.data = requestBody;
      }

      return axios(options)
      .catch(error => {
        if (requestTimestamp < this.abortTimestamp) {
          throw new retry.AbortError("Request was aborted.");
        }
        if (config.debug) {
          if (error.response) {
            // eslint-disable-next-line no-console
            console.log("Error Response: ", JSON.stringify(error.response, null, "\t"))
          } else if (error.request) {
            // eslint-disable-next-line no-console
            console.log("Network error", JSON.stringify(error, null, "\t"));
          } else {
            // eslint-disable-next-line no-console
            console.log(error.message)
          }
        }
        throw error;
      })
      .finally(() => this.canSendRequest = true);
    }

    return retry(call, {
      retries: retryCount,
      minTimeout: 200,
      maxTimeout: 2000,
      onFailedAttempt: error => {
        if(config.debug) {
          // eslint-disable-next-line no-console
          console.warn(`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`);
        }
      }
    }).catch(e => {
      if (!(e instanceof retry.AbortError)) {
        throw e;
      }
    });
  }
}

export default new UnrealService();
