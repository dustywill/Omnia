/**
 * @file plugins/as-built-documenter/http-client.js
 * @description Thin wrapper around axios to allow future HTTP customizations.
 */
const axios = require("axios");

/**
 * Performs a GET request with optional retries and returns raw text.
 *
 * @param {string} url
 * @param {import('axios').AxiosRequestConfig & { retries?: number }} [options]
 * @returns {Promise<string>}
 */
async function getText(url, options = {}) {
  const { retries = 0, timeout = 5000, ...axiosOptions } = options;
  const config = { timeout, responseType: "text", ...axiosOptions };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw lastError;
      }
    }
  }
}

/**
 * Performs a GET request with optional retries and returns the JSON data.
 *
 * `options` may include standard Axios request options along with a
 * `retries` count for how many additional attempts should be made when the
 * request fails.
 *
 * @param {string} url - The URL to fetch from.
 * @param {import('axios').AxiosRequestConfig & { retries?: number }} [options]
 *   Optional axios config overrides.
 * @returns {Promise<any>} Parsed JSON data from the response.
 */
async function getJson(url, options = {}) {
  const { retries = 0, timeout = 5000, ...axiosOptions } = options;
  const config = { timeout, ...axiosOptions };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw lastError;
      }
    }
  }
}

module.exports = { getJson, getText };
