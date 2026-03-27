"""
Vectorizerのシングルトンインスタンス

モデルを一度だけロードし、全エンドポイントで共有する
"""

from infrastructure.ml.e5_vectorizer_impl import E5VectorizerImpl

# アプリ起動時に一度だけモデルをロード
vectorizer = E5VectorizerImpl()
