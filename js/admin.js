// ========================================
// ADMIN SYSTEM WITH SUPABASE
// ========================================

// Configuration - REPLACE WITH YOUR VALUES
const SUPABASE_URL = "https://iuhtzvblmthenynuojtn.supabase.co"; // https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aHR6dmJsbXRoZW55bnVvanRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTAxNDYsImV4cCI6MjA4NTk4NjE0Nn0.8tzqkuh6rCbB_0TLc3K4TITI2IG-MhtUdWpuyATZPKk";

// Initialize Supabase (if configured)
let supabaseClient = null;
let currentUser = null;
let currentTags = [];
let fullImage = null;
let thumbImage = null;

// Check if Supabase is configured
function isSupabaseConfigured() {
  return (
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (isSupabaseConfigured() && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    const { data, error } = await supabaseClient.rpc("verify_password", {
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
  if (tab === 'tags') loadTagsManager();
}

// ========================================
// IMAGE UPLOAD
// ========================================

function setupUploadZone() {
    // Full image zone
    setupSingleZone('fullDropZone', 'fullImageInput', 'fullPreview', (file) => {
        fullImage = file;
    });
    
    // Thumbnail zone
    setupSingleZone('thumbDropZone', 'thumbImageInput', 'thumbPreview', (file) => {
        thumbImage = file;
    });
    loadAvailableTags();
}

function setupSingleZone(zoneId, inputId, previewId, onFile) {
    const dropZone = document.getElementById(zoneId);
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            onFile(e.target.files[0]);
            preview.innerHTML = `<div class="image-preview">
                <img src="${URL.createObjectURL(e.target.files[0])}" alt="Preview">
            </div>`;
        }
    });
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) {
            onFile(e.dataTransfer.files[0]);
            fileInput.files = e.dataTransfer.files;
            preview.innerHTML = `<div class="image-preview">
                <img src="${URL.createObjectURL(e.dataTransfer.files[0])}" alt="Preview">
            </div>`;
        }
    });
}

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
    
    if (!fullImage || !thumbImage) {
        alert('Please select both full-size and thumbnail images');
        return;
    }
    
    const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        tags: currentTags,
        source: {
            platform: document.getElementById('platform').value,
            creator: document.getElementById('creator').value,
            link: document.getElementById('sourceLink').value
        },
        protected: document.getElementById('protected').checked,
        status: currentUser.role === 'admin' ? 'approved' : 'pending',
        submitted_by: currentUser.name
    };
    
    if (!isSupabaseConfigured()) {
        downloadAsJSON(formData);
        return;
    }
    
    try {
        const section = document.getElementById('section').value;
        
        // Upload full image
        const fullFileName = `${section}-full/${Date.now()}_${fullImage.name}`;
        const { error: fullError } = await supabaseClient.storage
            .from('images')
            .upload(fullFileName, fullImage);
        
        if (fullError) throw fullError;
        
        // Upload thumbnail
        const thumbFileName = `${section}-thumb/${Date.now()}_${thumbImage.name}`;
        const { error: thumbError } = await supabaseClient.storage
            .from('images')
            .upload(thumbFileName, thumbImage);
        
        if (thumbError) throw thumbError;
        
        // Create database entry
        const imageData = {
            id: `img_${Date.now()}`,
            src: `${SUPABASE_URL}/storage/v1/object/public/images/${fullFileName}`,
            thumb: `${SUPABASE_URL}/storage/v1/object/public/images/${thumbFileName}`,
            title: formData.title,
            description: formData.description,
            tags: formData.tags,
            source_platform: formData.source.platform,
            source_creator: formData.source.creator,
            source_link: formData.source.link,
            protected: formData.protected,
            status: formData.status,
            submitted_by: formData.submitted_by
        };
        
        const { error: dbError } = await supabaseClient
            .from('images')
            .insert([imageData]);
        
        if (dbError) throw dbError;
        
        showToast('Upload successful!', 'success');
        resetForm();
        
        if (formData.status === 'pending') {
            alert('Your submission has been sent for review. Thank you!');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed: ' + error.message, 'error');
    }
}

function downloadAsJSON(data) {
  const json = JSON.stringify(
    {
      ...data,
      fullImage: fullImage?.name,
      thumbImage: thumbImage?.name,
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
    document.getElementById('uploadForm').reset();
    fullImage = null;
    thumbImage = null;
    currentTags = [];
    document.getElementById('fullPreview').innerHTML = '';
    document.getElementById('thumbPreview').innerHTML = '';
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
                SupabaseClient not configured. See SETUP-GUIDE.md for instructions.
            </p>
        `;
    return;
  }

  try {
    const { data, error } = await supabaseClient
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
                SupabaseClient not configured. See SETUP-GUIDE.md for instructions.
            </p>
        `;
    return;
  }

  try {
    const { data, error } = await supabaseClient
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
    const { error } = await supabaseClient
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
    const { error } = await supabaseClient.from("images").delete().eq("id", id);

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
    const { error } = await supabaseClient.from("images").delete().eq("id", id);

    if (error) throw error;

    showToast("Image deleted", "success");
    loadAllImages();
  } catch (error) {
    console.error("Delete error:", error);
    showToast("Failed to delete", "error");
  }
};


// ========================================
// TAG MANAGEMENT
// ========================================

let tagModalMode = null;
let tagModalData = null;

async function loadTagsManager() {
    if (!isSupabaseConfigured()) {
        document.getElementById('categoriesContainer').innerHTML = `
            <p style="text-align: center; color: var(--color-text-muted);">
                Supabase not configured. See SETUP-GUIDE.md for instructions.
            </p>
        `;
        return;
    }
    
    const { data: categories } = await supabaseClient
        .from('tag_categories')
        .select('*, tags(*)')
        .order('sort_order');
    
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = categories.map(cat => `
        <div class="category-card">
            <div class="category-header">
                <h3 class="category-title">${cat.name}</h3>
                <div class="category-actions">
                    <button class="btn-icon" onclick="editCategory('${cat.id}', '${cat.name}')" title="Edit category">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteCategory('${cat.id}')" title="Delete category">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="tag-list">
                ${cat.tags.sort((a,b) => a.sort_order - b.sort_order).map(tag => `
                    <div class="tag-chip">
                        <span class="tag-chip-name">${tag.name}</span>
                        <div class="tag-chip-actions">
                            <button class="tag-chip-btn" onclick="editTag('${tag.id}', '${tag.name}', '${tag.category_id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="tag-chip-btn" onclick="deleteTag('${tag.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="btn-secondary" onclick="openAddTagModal('${cat.id}')">
                <i class="fas fa-plus"></i> Add Tag
            </button>
        </div>
    `).join('');
}

async function loadAvailableTags() {
    if (!isSupabaseConfigured()) return;
    
    try {
        const { data: categories } = await supabaseClient
            .from('tag_categories')
            .select('*, tags(*)')
            .order('sort_order');
        
        const container = document.getElementById('availableTags');
        if (!container) return;
        
        container.innerHTML = categories.map(cat => `
            <div class="tag-category-section">
                <h4>${cat.name}</h4>
                <div class="tag-options">
                    ${cat.tags.sort((a,b) => a.sort_order - b.sort_order).map(tag => `
                        <button type="button" class="tag-option" data-tag="${tag.name}" onclick="toggleTagSelection('${tag.name}')">
                            ${tag.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load tags error:', error);
    }
}

function toggleTagSelection(tagName) {
    const button = document.querySelector(`[data-tag="${tagName}"]`);
    if (!button) return;
    
    button.classList.toggle('selected');
    
    if (button.classList.contains('selected')) {
        if (!currentTags.includes(tagName)) {
            currentTags.push(tagName);
            updateTagDisplay();
        }
    } else {
        currentTags = currentTags.filter(t => t !== tagName);
        updateTagDisplay();
    }
}

function openCategoryModal() {
    tagModalMode = 'add-category';
    tagModalData = null;
    document.getElementById('tagModalTitle').textContent = 'Add Category';
    document.getElementById('tagModalLabel').textContent = 'Category Name';
    document.getElementById('tagModalInput').value = '';
    document.getElementById('categorySelectGroup').style.display = 'none';
    document.getElementById('tagModal').classList.add('active');
}

function editCategory(id, name) {
    tagModalMode = 'edit-category';
    tagModalData = { id, name };
    document.getElementById('tagModalTitle').textContent = 'Edit Category';
    document.getElementById('tagModalLabel').textContent = 'Category Name';
    document.getElementById('tagModalInput').value = name;
    document.getElementById('categorySelectGroup').style.display = 'none';
    document.getElementById('tagModal').classList.add('active');
}

async function openAddTagModal(categoryId) {
    tagModalMode = 'add-tag';
    tagModalData = { categoryId };
    document.getElementById('tagModalTitle').textContent = 'Add Tag';
    document.getElementById('tagModalLabel').textContent = 'Tag Name';
    document.getElementById('tagModalInput').value = '';
    
    await populateCategorySelect();
    document.getElementById('tagModalCategory').value = categoryId;
    document.getElementById('categorySelectGroup').style.display = 'block';
    document.getElementById('tagModal').classList.add('active');
}

async function editTag(id, name, categoryId) {
    tagModalMode = 'edit-tag';
    tagModalData = { id, name, categoryId };
    document.getElementById('tagModalTitle').textContent = 'Edit Tag';
    document.getElementById('tagModalLabel').textContent = 'Tag Name';
    document.getElementById('tagModalInput').value = name;
    
    await populateCategorySelect();
    document.getElementById('tagModalCategory').value = categoryId;
    document.getElementById('categorySelectGroup').style.display = 'block';
    document.getElementById('tagModal').classList.add('active');
}

async function populateCategorySelect() {
    const { data: categories } = await supabaseClient
        .from('tag_categories')
        .select('*')
        .order('sort_order');
    
    const select = document.getElementById('tagModalCategory');
    select.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

function closeTagModal() {
    document.getElementById('tagModal').classList.remove('active');
}

async function saveTagModal() {
    const value = document.getElementById('tagModalInput').value.trim();
    if (!value) {
        alert('Please enter a name');
        return;
    }
    
    try {
        if (tagModalMode === 'add-category') {
            const id = value.toLowerCase().replace(/\s+/g, '-');
            await supabaseClient.from('tag_categories').insert([
                { id, name: value, sort_order: 999 }
            ]);
        }
        else if (tagModalMode === 'edit-category') {
            await supabaseClient.from('tag_categories')
                .update({ name: value })
                .eq('id', tagModalData.id);
        }
        else if (tagModalMode === 'add-tag') {
            const categoryId = document.getElementById('tagModalCategory').value;
            const id = value.toLowerCase().replace(/\s+/g, '-');
            await supabaseClient.from('tags').insert([
                { id, name: value, category_id: categoryId, sort_order: 999 }
            ]);
        }
        else if (tagModalMode === 'edit-tag') {
            const categoryId = document.getElementById('tagModalCategory').value;
            await supabaseClient.from('tags')
                .update({ name: value, category_id: categoryId })
                .eq('id', tagModalData.id);
        }
        
        closeTagModal();
        loadTagsManager();
        loadAvailableTags(); // Refresh upload form tags
        showToast('Saved successfully', 'success');
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save: ' + error.message, 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? All tags in it will also be deleted.')) return;
    
    try {
        await supabaseClient.from('tag_categories').delete().eq('id', id);
        loadTagsManager();
        showToast('Category deleted', 'success');
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete', 'error');
    }
}

async function deleteTag(id) {
    if (!confirm('Delete this tag?')) return;
    
    try {
        await supabaseClient.from('tags').delete().eq('id', id);
        loadTagsManager();
        loadAvailableTags();
        showToast('Tag deleted', 'success');
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete', 'error');
    }
}

// Update switchTab function to load tags when switching to tags tab
// Find the existing switchTab function and add:
if (tab === 'tags') loadTagsManager();



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
