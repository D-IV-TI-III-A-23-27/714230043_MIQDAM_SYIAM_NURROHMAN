# 📊 Hasil Benchmarking PEDE — SPECTER Embedding

**Paper Uji:** *A machine learning model for multi-class classification of quenched and partitioned steel microstructure type by the k-nearest neighbor algorithm*  
**DOI:** `10.1016/j.commatsci.2023.112321`  
**Model Embedding:** SPECTER (`allenai/specter`) — 768 dimensi, berbasis SciBERT yang di-fine-tune untuk embedding dokumen ilmiah

## Hasil Benchmarking (10 Eksperimen)

| Ukuran Chunk | Overlap | Metode Chunking | Model Embedding | Dukungan Bahasa | Tipe Query Uji | Top-K | Filter Metadata | Hit Rate | Latensi | Ukuran Index DB | Catatan |
|:---:|:---:|:---|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---|
| 256 | 50 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 5 | Ya (DOI) | 60% | 0.06s | 0.7 MB | *Chunk sangat kecil* |
| 500 | 100 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 5 | Ya (DOI) | 60% | 0.06s | 0.7 MB | *Chunk kecil* |
| 1000 | 200 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 5 | Ya (DOI) | 60% | 0.06s | 0.7 MB | *Chunk medium (baseline)* |
| 2000 | 400 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 5 | Ya (DOI) | 60% | 0.06s | 0.7 MB | *Chunk besar* |
| 1000 | 0 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 5 | Ya (DOI) | 60% | 0.06s | 0.7 MB | *Overlap 0% (tanpa)* |
| 1000 | 100 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 5 | Ya (DOI) | 60% | 0.07s | 0.7 MB | *Overlap 10%* |
| 1000 | 500 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 5 | Ya (DOI) | 60% | 0.07s | 0.7 MB | *Overlap 50%* |
| 1000 | 200 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 3 | Ya (DOI) | 20% | 0.06s | 0.7 MB | *Top-K kecil (3) — Banyak informasi terlewat* |
| 1000 | 200 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 10 | Ya (DOI) | **100%** | 0.07s | 0.7 MB | *Top-K besar (10) — Semua query terjawab!* |
| 500 | 100 | Hybrid | SPECTER (`allenai/specter`) | Hanya Inggris | Campuran (5 query) | 10 | Ya (DOI) | **100%** | 0.06s | 0.7 MB | *Chunk kecil + Top-K besar — Paling optimal* |

---

## Detail Hasil per Query

### 5 Pertanyaan Tes

| # | Pertanyaan | Tipe | Bahasa | Jawaban yang Diharapkan |
|:---:|---|---|:---:|---|
| Q1 | What is the overall f1-score of the KNN classifier on the test dataset? | Factoid | EN | 77.7% |
| Q2 | Mengapa kelas mikrostruktur M,RA sulit diprediksi oleh model? | Reasoning | ID | Kelas {M, RA} confusing, f1-score 0.51 |
| Q3 | Bagaimana cara mengatasi ketidakseimbangan data dalam penelitian ini? | Semantic | ID | SMOTE oversampling |
| Q4 | Which chemical element has the most influence on steel microstructure evolution? | Factoid | EN | Mn (Mangan) |
| Q5 | berapa suhu quenching dan partitioning yang dipakai di eksperimen validasi? | Conversational | ID | 180°C dan 200°C |

### Hasil per Query (Top-K = 5 vs Top-K = 10)

| # | Tipe | Bahasa | Top-K = 5 | Top-K = 10 |
|:---:|:---|:---:|:---:|:---:|
| Q1 | Factoid | EN | HIT | HIT |
| Q2 | Reasoning | ID | MISS | HIT |
| Q3 | Semantic | ID | MISS | HIT |
| Q4 | Factoid | EN | HIT | HIT |
| Q5 | Conversational | ID | HIT | HIT |
| | | **Total** | **3/5 = 60%** | **5/5 = 100%** |

---

## Analisis dan Temuan

### 1. Pengaruh Ukuran Chunk (256, 500, 1000, 2000)

Mengubah ukuran chunk dari 256 hingga 2000 karakter **tidak berpengaruh** pada Hit Rate — semua tetap 60% dengan Top-K = 5. Hal ini menunjukkan bahwa metode chunking Hybrid (Header + Recursive) sudah cukup baik dalam mempertahankan konteks informasi di setiap ukuran chunk.

> **Temuan:** Ukuran chunk tidak menjadi faktor pembeda utama untuk model SPECTER pada dataset ini.

### 2. Pengaruh Overlap (0%, 10%, 20%, 50%)

Menghilangkan overlap sepenuhnya (0%) maupun menaikkannya hingga 50% juga **tidak mengubah** Hit Rate. Informasi yang dicari tetap ditemukan di chunk yang sama terlepas dari seberapa besar tumpang tindih antar potongan.

> **Temuan:** Overlap bermanfaat untuk menjaga kontinuitas teks, tetapi tidak berpengaruh signifikan terhadap akurasi retrieval pada dataset ini.

### 3. Pengaruh Top-K (3, 5, 10) — Faktor Paling Berpengaruh

| Top-K | Hit Rate | Penjelasan |
|:---:|:---:|---|
| 3 | 20% | Hanya Q1 (English Factoid) yang ditemukan. Terlalu sedikit chunk dikembalikan. |
| 5 | 60% | Q1, Q4, Q5 ditemukan. Q2 & Q3 (Bahasa Indonesia murni) belum muncul di 5 teratas. |
| 10 | **100%** | Semua query terjawab! Jawaban Q2 & Q3 berada di ranking 6-10. |

Top-K adalah **parameter paling berpengaruh** dalam benchmark ini. Menaikkan Top-K dari 5 ke 10 menaikkan Hit Rate dari 60% menjadi 100%.

**Mengapa?** SPECTER adalah model Bahasa Inggris. Query Bahasa Indonesia (Q2, Q3) menghasilkan vektor yang tidak terlalu dekat dengan chunk yang berisi jawaban, sehingga chunk tersebut berada di peringkat lebih rendah (6-10). Dengan Top-K = 10, chunk tersebut akhirnya ikut dikembalikan.

### 4. Konfigurasi Paling Optimal

Berdasarkan 10 eksperimen, konfigurasi terbaik adalah:

| Parameter | Nilai Optimal | Alasan |
|---|:---:|---|
| Chunk Size | **500** | Chunk lebih kecil = konten lebih fokus per chunk |
| Overlap | **100** | Menjaga kontinuitas teks antar potongan |
| Top-K | **10** | Menjamin semua jawaban ditemukan termasuk query lintas bahasa |
| Hit Rate | **100%** | Semua 5 pertanyaan tes berhasil dijawab |

### 5. Keterbatasan SPECTER

- **Bahasa:** Hanya mendukung Bahasa Inggris. Query Bahasa Indonesia bisa tetap ditemukan jika Top-K cukup besar, tetapi ranking-nya lebih rendah.
- **Konteks:** Window 512 token — chunk yang melebihi batas ini akan terpotong.
- **Domain:** Dilatih pada paper ilmiah umum menggunakan data sitasi, bukan domain spesifik.

---

## Konfigurasi Teknis

| Parameter | Nilai |
|---|---|
| PDF → Markdown | `pymupdf4llm` |
| Chunking Tier 1 | `MarkdownHeaderTextSplitter` (split by `#`, `##`, `###`) |
| Chunking Tier 2 | `RecursiveCharacterTextSplitter` (fallback jika chunk > ukuran target) |
| Model Embedding | SPECTER (`allenai/specter`) — 768 dimensi |
| Vector Database | Qdrant (lokal, folder `./qdrant_db`) |
| Distance Metric | Cosine Similarity |
| Jumlah Chunks | 81 |
| Dimensi Vektor | 768 |


