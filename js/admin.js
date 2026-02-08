// ========================================
// ADMIN SYSTEM WITH SUPABASE
// ========================================

// Configuration - REPLACE WITH YOUR VALUES
const SUPABASE_URL = "https://iuhtzvblmthenynuojtn.supabase.co"; // https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aHR6dmJsbXRoZW55bnVvanRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTAxNDYsImV4cCI6MjA4NTk4NjE0Nn0.8tzqkuh6rCbB_0TLc3K4TITI2IG-MhtUdWpuyATZPKk";

// Initialize Supabase (if configured)
let supabase = null;
let currentUser = null;
let uploadedFiles = [];
let currentTags = [];

// Check if Supabase is configured
function isSupabaseConfigured() {
  return (
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (isSupabaseConfigured()) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  setupUploadZone();
  setupTagInput();

  // Check for existing session
  const savedUser = sessionStorage.getItem("admin_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showAdminPanel();
  }
});

// ========================================
// AUTHENTICATION
// ========================================

async function checkAdminPassword() {
  const password = document.getElementById("adminPassword").value;
  const errorMsg = document.getElementById("loginError");

  if (!password) return;

  if (!isSupabaseConfigured()) {
    // Fallback to simple password check
    const ADMIN_PASSWORD = "brycho3087"; // CHANGE THIS
    const CONTRIBUTOR_PASSWORD = "tilly3087"; // CHANGE THIS

    if (password === ADMIN_PASSWORD) {
      currentUser = { role: "admin", name: "Admin" };
      sessionStorage.setItem("admin_user", JSON.stringify(currentUser));
      showAdminPanel();
    } else if (password === CONTRIBUTOR_PASSWORD) {
      currentUser = { role: "contributor", name: "Contributor" };
      sessionStorage.setItem("admin_user", JSON.stringify(currentUser));
      showAdminPanel();
    } else {
      errorMsg.style.display = "block";
      setTimeout(() => (errorMsg.style.display = "none"), 3000);
    }
    return;
  }

  // Supabase authentication
  try {
    const { data, error } = await supabase.rpc("verify_password", {
      input_password: password,
    });

    if (error || !data || data.length === 0) {
      errorMsg.style.display = "block";
      setTimeout(() => (errorMsg.style.display = "none"), 3000);
      return;
    }

    currentUser = data[0];
    sessionStorage.setItem("admin_user", JSON.stringify(currentUser));
    showAdminPanel();
  } catch (error) {
    console.error("Auth error:", error);
    alert("Authentication failed. Check console for details.");
  }
}

function showAdminPanel() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  document.getElementById("roleBadge").textContent =
    currentUser.role.toUpperCase();

  // Hide admin-only tabs for contributors
  if (currentUser.role === "contributor") {
    document.getElementById("queueTab").style.display = "none";
  }

  loadData();
}

function logout() {
  sessionStorage.removeItem("admin_user");
  currentUser = null;
  location.reload();
}

// ========================================
// TAB NAVIGATION
// ========================================

function switchTab(tab) {
  // Update tab buttons
  document
    .querySelectorAll(".admin-tab")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.closest(".admin-tab").classList.add("active");

  // Update content
  document
    .querySelectorAll(".admin-content")
    .forEach((content) => content.classList.remove("active"));
  document.getElementById(`${tab}Content`).classList.add("active");

  // Load data for the tab
  if (tab === "queue") loadQueue();
  if (tab === "manage") loadAllImages();
}

// ========================================
// IMAGE UPLOAD
// ========================================

function setupUploadZone() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("imageInput");

  dropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(files) {
  uploadedFiles = Array.from(files);
  displayImagePreviews();
}

function displayImagePreviews() {
  const container = document.getElementById("imagePreviews");
  container.innerHTML = uploadedFiles
    .map(
      (file, index) => `
        <div class="image-preview">
            <img src="${URL.createObjectURL(file)}" alt="Preview ${index + 1}">
            <button class="image-preview-remove" onclick="removeImage(${index})" type="button">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `,
    )
    .join("");
}

window.removeImage = function (index) {
  uploadedFiles.splice(index, 1);
  displayImagePreviews();
};

// ========================================
// TAG INPUT
// ========================================

function setupTagInput() {
  const input = document.getElementById("tagInput");
  const container = document.getElementById("tagContainer");

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = input.value.trim().toLowerCase();
      if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        updateTagDisplay();
        input.value = "";
      }
    }
  });
}

function updateTagDisplay() {
  const container = document.getElementById("tagContainer");
  const input = document.getElementById("tagInput");

  const tagsHTML = currentTags
    .map(
      (tag, index) => `
        <div class="input-tag">
            ${tag}
            <button type="button" onclick="removeTag(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `,
    )
    .join("");

  container.innerHTML = tagsHTML;
  container.appendChild(input);
}

window.removeTag = function (index) {
  currentTags.splice(index, 1);
  updateTagDisplay();
};

// ========================================
// FORM SUBMISSION
// ========================================

async function handleUpload(event) {
  event.preventDefault();

  if (uploadedFiles.length === 0) {
    alert("Please select at least one image");
    return;
  }

  const formData = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    tags: currentTags,
    source: {
      platform: document.getElementById("platform").value,
      creator: document.getElementById("creator").value,
      link: document.getElementById("sourceLink").value,
    },
    protected: document.getElementById("protected").checked,
    status: currentUser.role === "admin" ? "approved" : "pending",
    submitted_by: currentUser.name,
  };

  if (!isSupabaseConfigured()) {
    // Fallback: Download JSON file
    downloadAsJSON(formData);
    return;
  }

  try {
    // Upload images to Supabase Storage
    const imageUrls = [];
    for (const file of uploadedFiles) {
      // Get section from form (add this to admin.html first - see below)
      const section = document.getElementById("section").value; // 'buildbook' or 'signcenter'
      const isThumbnail = index > 0; // First image = full, rest = thumbnails
      const folder = isThumbnail ? `${section}-thumb` : `${section}-full`;

      const fileName = `${folder}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
      imageUrls.push(publicUrl);
    }

    // Create database entry
    const imageData = {
      id: `img_${Date.now()}`,
      src: imageUrls[0],
      thumb: imageUrls[0], // TODO: Generate thumbnail
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
      source_platform: formData.source.platform,
      source_creator: formData.source.creator,
      source_link: formData.source.link,
      protected: formData.protected,
      additional_images: imageUrls.slice(1),
      status: formData.status,
      submitted_by: formData.submitted_by,
    };

    const { error: dbError } = await supabase
      .from("images")
      .insert([imageData]);

    if (dbError) throw dbError;

    showToast("Upload successful!", "success");
    resetForm();

    if (formData.status === "pending") {
      alert("Your submission has been sent for review. Thank you!");
    }
  } catch (error) {
    console.error("Upload error:", error);
    showToast("Upload failed: " + error.message, "error");
  }
}

function downloadAsJSON(data) {
  const json = JSON.stringify(
    {
      ...data,
      images: uploadedFiles.map((f) => f.name),
      id: `img_${Date.now()}`,
      uploadDate: new Date().toISOString().split("T")[0],
    },
    null,
    2,
  );

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `submission_${Date.now()}.json`;
  a.click();

  alert(
    "JSON downloaded! Add this to inspiration-images.json and upload your images to /images/ folder.",
  );
  resetForm();
}

function resetForm() {
  document.getElementById("uploadForm").reset();
  uploadedFiles = [];
  currentTags = [];
  displayImagePreviews();
  updateTagDisplay();
}

// ========================================
// DATA LOADING
// ========================================

async function loadData() {
  loadQueue();
  loadAllImages();
}

async function loadQueue() {
  if (!isSupabaseConfigured()) {
    document.getElementById("submissionQueue").innerHTML = `
            <p style="text-align: center; color: var(--color-text-muted);">
                Supabase not configured. See SETUP-GUIDE.md for instructions.
            </p>
        `;
    return;
  }

  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const queueCount = document.getElementById("queueCount");
    if (queueCount) {
      queueCount.textContent = data.length > 0 ? `(${data.length})` : "";
    }

    renderQueue(data);
  } catch (error) {
    console.error("Load queue error:", error);
  }
}

async function loadAllImages() {
  if (!isSupabaseConfigured()) {
    document.getElementById("contentGrid").innerHTML = `
            <p style="text-align: center; color: var(--color-text-muted);">
                Supabase not configured. See SETUP-GUIDE.md for instructions.
            </p>
        `;
    return;
  }

  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("status", "approved")
      .order("upload_date", { ascending: false });

    if (error) throw error;

    renderContentGrid(data);
  } catch (error) {
    console.error("Load images error:", error);
  }
}

// ========================================
// RENDERING
// ========================================

function renderQueue(submissions) {
  const container = document.getElementById("submissionQueue");

  if (submissions.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--color-text-muted);">No pending submissions</p>';
    return;
  }

  container.innerHTML = submissions
    .map(
      (sub) => `
        <div class="submission-card">
            <div class="submission-images">
                <div class="submission-thumbnail">
                    <img src="${sub.src}" alt="${sub.title}">
                </div>
            </div>
            <div class="submission-info">
                <h3>${sub.title}</h3>
                <p class="submission-meta">
                    Submitted by ${sub.submitted_by} • ${new Date(sub.created_at).toLocaleDateString()}
                </p>
                <p>${sub.description || "No description"}</p>
                <div class="submission-tags">
                    ${sub.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
                </div>
            </div>
            <div class="submission-actions">
                <button class="btn-approve" onclick="approveSubmission('${sub.id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-edit" onclick="editSubmission('${sub.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-reject" onclick="rejectSubmission('${sub.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderContentGrid(images) {
  const container = document.getElementById("contentGrid");

  if (images.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--color-text-muted);">No images yet</p>';
    return;
  }

  container.innerHTML = images
    .map(
      (img) => `
        <div class="content-card">
            <img class="content-card-image" src="${img.thumb || img.src}" alt="${img.title}">
            <div class="content-card-body">
                <h3 class="content-card-title">${img.title}</h3>
                <p class="content-card-meta">
                    ${img.protected ? "🔒 Protected • " : ""}${new Date(img.upload_date).toLocaleDateString()}
                </p>
                <div class="content-card-actions">
                    <button class="btn-secondary" onclick="editImage('${img.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="deleteImage('${img.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

// ========================================
// ACTIONS
// ========================================

window.approveSubmission = async function (id) {
  if (!confirm("Approve this submission?")) return;

  try {
    const { error } = await supabase
      .from("images")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) throw error;

    showToast("Submission approved!", "success");
    loadQueue();
    loadAllImages();
  } catch (error) {
    console.error("Approve error:", error);
    showToast("Failed to approve", "error");
  }
};

window.rejectSubmission = async function (id) {
  if (!confirm("Reject this submission? This will delete it permanently."))
    return;

  try {
    const { error } = await supabase.from("images").delete().eq("id", id);

    if (error) throw error;

    showToast("Submission rejected", "success");
    loadQueue();
  } catch (error) {
    console.error("Reject error:", error);
    showToast("Failed to reject", "error");
  }
};

window.deleteImage = async function (id) {
  if (!confirm("Delete this image permanently?")) return;

  try {
    const { error } = await supabase.from("images").delete().eq("id", id);

    if (error) throw error;

    showToast("Image deleted", "success");
    loadAllImages();
  } catch (error) {
    console.error("Delete error:", error);
    showToast("Failed to delete", "error");
  }
};

// ========================================
// UTILITIES
// ========================================

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <p>${message}</p>
    `;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}
