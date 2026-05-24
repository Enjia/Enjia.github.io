const PROGRESS_KEY = 'mnemonicProgress';
const PREDICTION_KEY = 'mnemonicPredictions';

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

export function createProgressStore(storage = globalThis.localStorage) {
  return {
    readProgress() {
      return readJson(storage, PROGRESS_KEY);
    },

    writeProgress(progress) {
      writeJson(storage, PROGRESS_KEY, progress);
    },

    updateCard(cardId, record) {
      const progress = readJson(storage, PROGRESS_KEY);
      progress[cardId] = record;
      writeJson(storage, PROGRESS_KEY, progress);
      return progress;
    },

    readPrediction(predictionId) {
      const predictions = readJson(storage, PREDICTION_KEY);
      return predictions[predictionId] ?? '';
    },

    writePrediction(predictionId, value) {
      const predictions = readJson(storage, PREDICTION_KEY);
      predictions[predictionId] = value;
      writeJson(storage, PREDICTION_KEY, predictions);
    },

    clearAll() {
      storage.removeItem(PROGRESS_KEY);
      storage.removeItem(PREDICTION_KEY);
    }
  };
}
