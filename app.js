// ==============================
// DATA CATATAN
// ==============================

let catatan =
    JSON.parse(localStorage.getItem("catatan")) || [];

let modeEdit = false;
let idSedangDiedit = null;


// ==============================
// ELEMENT
// ==============================

const formCatatan =
    document.getElementById("formCatatan");

const judul =
    document.getElementById("judul");

const isi =
    document.getElementById("isi");

const daftarCatatan =
    document.getElementById("daftarCatatan");

const jumlahCatatan =
    document.getElementById("jumlahCatatan");

const emptyState =
    document.getElementById("emptyState");

const hapusSemua =
    document.getElementById("hapusSemua");

const saveButton =
    document.querySelector(".save-button");


// ==============================
// SIMPAN CATATAN
// ==============================

function simpanCatatan() {

    const judulValue =
        judul.value.trim();

    const isiValue =
        isi.value.trim();


    // Cek input
    if (
        judulValue === "" ||
        isiValue === ""
    ) {

        alert(
            "Judul dan isi catatan harus diisi!"
        );

        return;
    }


    // ==========================
    // JIKA SEDANG EDIT
    // ==========================

    if (modeEdit) {

        const index =
            catatan.findIndex(
                function(data) {
                    return data.id === idSedangDiedit;
                }
            );


        if (index !== -1) {

            catatan[index].judul =
                judulValue;

            catatan[index].isi =
                isiValue;

            catatan[index].tanggal =
                waktuSekarang();

        }


        modeEdit = false;

        idSedangDiedit = null;


        if (saveButton) {

            saveButton.innerHTML =
                "<span>＋</span> Simpan Catatan";

        }

    }


    // ==========================
    // JIKA CATATAN BARU
    // ==========================

    else {

        const data = {

            id: Date.now(),

            judul: judulValue,

            isi: isiValue,

            tanggal: waktuSekarang()

        };


        catatan.unshift(data);

    }


    // Simpan data
    simpanKeLocalStorage();


    // Kosongkan form
    formCatatan.reset();


    // Tampilkan
    tampilkanCatatan();

}


// ==============================
// WAKTU SEKARANG
// ==============================

function waktuSekarang() {

    return new Date().toLocaleString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==============================
// LOCAL STORAGE
// ==============================

function simpanKeLocalStorage() {

    localStorage.setItem(
        "catatan",
        JSON.stringify(catatan)
    );

}


// ==============================
// ESCAPE HTML
// ==============================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


// ==============================
// TAMPILKAN CATATAN
// ==============================

function tampilkanCatatan() {

    if (!daftarCatatan) {
        return;
    }


    daftarCatatan.innerHTML = "";


    // Jumlah catatan
    if (jumlahCatatan) {

        jumlahCatatan.textContent =
            catatan.length;

    }


    // Kalau belum ada catatan
    if (catatan.length === 0) {

        if (emptyState) {

            emptyState.style.display =
                "block";

        }

        if (hapusSemua) {

            hapusSemua.style.display =
                "none";

        }

        return;
    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }

    if (hapusSemua) {

        hapusSemua.style.display =
            "block";

    }


    // ==========================
    // TAMPILKAN SEMUA CATATAN
    // ==========================

    catatan.forEach(
        function(data) {

            const card =
                document.createElement("article");


            card.className =
                "catatan";


            card.innerHTML = `

                <h3>
                    ${escapeHTML(data.judul)}
                </h3>

                <p>
                    ${escapeHTML(data.isi)}
                </p>

                <div class="tanggal">
                    🕒 ${data.tanggal || "Catatan lama"}
                </div>

                <div class="action-buttons">

                    <button
                        class="edit"
                        onclick="editCatatan(${data.id})"
                    >
                        ✏️ Edit
                    </button>

                    <button
                        class="hapus"
                        onclick="hapusCatatan(${data.id})"
                    >
                        🗑️ Hapus
                    </button>

                </div>

            `;


            daftarCatatan.appendChild(card);

        }
    );

}


// ==============================
// EDIT CATATAN
// ==============================

function editCatatan(id) {

    const data =
        catatan.find(
            function(item) {
                return item.id === id;
            }
        );


    if (!data) {

        alert("Catatan tidak ditemukan!");

        return;

    }


    // Aktifkan mode edit
    modeEdit = true;

    idSedangDiedit = id;


    // Masukkan isi ke form
    judul.value =
        data.judul;

    isi.value =
        data.isi;


    // Ubah tombol
    if (saveButton) {

        saveButton.innerHTML =
            "💾 Update Catatan";

    }


    // Fokus
    judul.focus();


    // Scroll ke atas
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==============================
// HAPUS CATATAN
// ==============================

function hapusCatatan(id) {

    const yakin =
        confirm(
            "Yakin ingin menghapus catatan ini?"
        );


    if (!yakin) {
        return;
    }


    catatan =
        catatan.filter(
            function(data) {

                return data.id !== id;

            }
        );


    simpanKeLocalStorage();

    tampilkanCatatan();

}


// ==============================
// HAPUS SEMUA
// ==============================

if (hapusSemua) {

    hapusSemua.addEventListener(
        "click",
        function() {

            if (catatan.length === 0) {

                return;

            }


            const yakin =
                confirm(
                    "Yakin ingin menghapus semua catatan?"
                );


            if (!yakin) {

                return;

            }


            catatan = [];


            simpanKeLocalStorage();

            tampilkanCatatan();

        }
    );

}


// ==============================
// FORM SUBMIT
// ==============================

if (formCatatan) {

    formCatatan.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            simpanCatatan();

        }
    );

}


// ==============================
// SERVICE WORKER
// ==============================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register("service-worker.js")

                .then(
                    function() {

                        console.log(
                            "Service Worker berhasil dijalankan"
                        );

                    }
                )

                .catch(
                    function(error) {

                        console.log(
                            "Service Worker gagal:",
                            error
                        );

                    }
                );

        }
    );

}


// ==============================
// JALANKAN APLIKASI
// ==============================

tampilkanCatatan();