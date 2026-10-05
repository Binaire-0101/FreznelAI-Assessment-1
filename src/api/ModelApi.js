const API_URL = "/api/models";

export class ModelApi {
  fetchModels() {
    return fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        if (!data || !Array.isArray(data.models)) {
          throw new Error("Invalid API response.");
        }

        return data.models;
      });
  }
}
