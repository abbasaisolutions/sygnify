import pandas as pd
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def preprocess_data(file_path):
        try:
            df = pd.read_csv(file_path)
            missing_columns = df.columns[df.isnull().any()].tolist()
            logger.info(f"Preprocessed {file_path}, missing columns: {missing_columns}")
            return {"data": df.head(10).to_dict(), "missing_columns": missing_columns}
        except Exception as e:
            logger.error(f"Preprocessing failed: {str(e)}")
            return {"data": [], "missing_columns": [], "error": str(e)}