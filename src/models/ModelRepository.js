import { ModelApi } from "../api/ModelApi";
import { Model } from "./Model";

const CACHE_KEY = "freznel_ai_models_cache";

export class ModelRepository {
  constructor() {
    this.api = new ModelApi();
  }

  loadModels() {
    return this.api
      .fetchModels()
      .then((data) => {
        this.saveToCache(data);

        return {
          models: data.map((model) => new Model(model)),
          source: "api",
        };
      })
      .catch((error) => {
        console.warn("API unavailable. Trying local cache.", error);

        const cachedModels = this.loadFromCache();

        if (!cachedModels) {
          throw new Error(
            "Unable to load models from the API and no local cache is available.",
          );
        }

        return {
          models: cachedModels.map((model) => new Model(model)),
          source: "cache",
        };
      });
  }

  saveToCache(models) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(models));
    } catch (error) {
      console.warn("Unable to save models to local cache.", error);
    }
  }

  loadFromCache() {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (!cachedData) {
        return null;
      }

      const models = JSON.parse(cachedData);

      if (!Array.isArray(models)) {
        return null;
      }

      return models;
    } catch (error) {
      console.warn("Unable to read local model cache.", error);

      return null;
    }
  }
}
