// Fungsi Helper
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return minutes + ' menit lalu';
    if (hours < 24) return hours + ' jam lalu';
    if (days < 7) return days + ' hari lalu';
    
    return d.toLocaleDateString('id-ID');
}

function formatPrice(price) {
    return 'Rp ' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function createAvatarUrl(name) {
    return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzIwQzk5NyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEwMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iUG9wcGlucyIgZm9udC13ZWlnaHQ9IjcwMCI+JHtgetJuaXRpYWxzKG5hbWUpfTwvdGV4dD48L3N2Zz4=`;
}

function getStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
        stars += i < fullStars ? '★' : '☆';
    }
    return stars;
}

// Check Authentication
function checkAuth() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = 'index.html';
            }
            resolve(user);
        });
    });
}

async function getCurrentUser() {
    const uid = localStorage.getItem('userId') || firebase.auth().currentUser?.uid;
    if (!uid) return null;
    
    try {
        const doc = await firebase.firestore().collection('users').doc(uid).get();
        return doc.exists ? { uid, ...doc.data() } : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Sidebar Navigation
function initSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    });
}

// Logout
async function logout() {
    try {
        await firebase.auth().signOut();
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Load Services dari Firestore
async function loadServices(callback) {
    try {
        firebase.firestore().collection('services')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const services = [];
                snapshot.forEach((doc) => {
                    services.push({ id: doc.id, ...doc.data() });
                });
                callback(services);
            });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load Jobs dari Firestore
async function loadJobs(callback) {
    try {
        firebase.firestore().collection('jobs')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const jobs = [];
                snapshot.forEach((doc) => {
                    jobs.push({ id: doc.id, ...doc.data() });
                });
                callback(jobs);
            });
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

// Load Feed (Services + Jobs)
async function loadFeed(callback) {
    try {
        let services = [];
        let jobs = [];
        let loaded = 0;

        firebase.firestore().collection('services')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                services = [];
                snapshot.forEach((doc) => {
                    services.push({ 
                        id: doc.id, 
                        type: 'service',
                        ...doc.data() 
                    });
                });
                combineFeed();
            });

        firebase.firestore().collection('jobs')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                jobs = [];
                snapshot.forEach((doc) => {
                    jobs.push({ 
                        id: doc.id, 
                        type: 'job',
                        ...doc.data() 
                    });
                });
                combineFeed();
            });

        function combineFeed() {
            const feed = [...services, ...jobs]
                .sort((a, b) => b.createdAt - a.createdAt);
            callback(feed);
        }
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}

// Create Service
async function createService(data) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not found');

        const serviceData = {
            userId: currentUser.uid,
            userName: currentUser.name,
            userPhoto: currentUser.photo,
            userRating: currentUser.averageRating || 0,
            isVerified: currentUser.isVerified || false,
            isPremium: currentUser.isPremium || false,
            ...data,
            createdAt: new Date()
        };

        const docRef = await firebase.firestore().collection('services').add(serviceData);
        return { id: docRef.id, ...serviceData };
    } catch (error) {
        console.error('Error creating service:', error);
        throw error;
    }
}

// Create Job
async function createJob(data) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not found');

        const jobData = {
            userId: currentUser.uid,
            userName: currentUser.name,
            userPhoto: currentUser.photo,
            userRating: currentUser.averageRating || 0,
            isVerified: currentUser.isVerified || false,
            isPremium: currentUser.isPremium || false,
            totalApplicants: 0,
            status: 'open',
            ...data,
            createdAt: new Date()
        };

        const docRef = await firebase.firestore().collection('jobs').add(jobData);
        return { id: docRef.id, ...jobData };
    } catch (error) {
        console.error('Error creating job:', error);
        throw error;
    }
}

// Apply for Job
async function applyForJob(jobId) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not found');

        const jobRef = firebase.firestore().collection('jobs').doc(jobId);
        const jobDoc = await jobRef.get();
        if (!jobDoc.exists) throw new Error('Job not found');

        // Cek sudah apply atau belum
        const existingApp = await firebase.firestore()
            .collection('jobs').doc(jobId)
            .collection('applicants')
            .where('workerId', '==', currentUser.uid)
            .get();

        if (!existingApp.empty) {
            throw new Error('Anda sudah melamar job ini');
        }

        // Tambah pelamar
        await jobRef.collection('applicants').add({
            workerId: currentUser.uid,
            workerName: currentUser.name,
            workerPhoto: currentUser.photo,
            workerRating: currentUser.averageRating || 0,
            whatsapp: currentUser.whatsapp,
            createdAt: new Date()
        });

        // Update total applicants
        await jobRef.update({
            totalApplicants: (jobDoc.data().totalApplicants || 0) + 1
        });

        return true;
    } catch (error) {
        console.error('Error applying for job:', error);
        throw error;
    }
}

// Get Job Applicants
async function getJobApplicants(jobId, callback) {
    try {
        firebase.firestore().collection('jobs').doc(jobId)
            .collection('applicants')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const applicants = [];
                snapshot.forEach((doc) => {
                    applicants.push({ id: doc.id, ...doc.data() });
                });
                callback(applicants);
            });
    } catch (error) {
        console.error('Error loading applicants:', error);
    }
}

// Select Worker for Job
async function selectWorkerForJob(jobId, workerId) {
    try {
        const jobRef = firebase.firestore().collection('jobs').doc(jobId);
        
        await jobRef.update({
            selectedWorkerId: workerId,
            status: 'closed'
        });

        return true;
    } catch (error) {
        console.error('Error selecting worker:', error);
        throw error;
    }
}

// Add Review
async function addReview(toUserId, rating, comment, jobId) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not found');

        const reviewData = {
            fromUser: currentUser.uid,
            fromUserName: currentUser.name,
            fromUserPhoto: currentUser.photo,
            toUser: toUserId,
            rating: rating,
            comment: comment,
            jobId: jobId,
            createdAt: new Date()
        };

        const docRef = await firebase.firestore().collection('reviews').add(reviewData);

        // Update user rating
        const userRef = firebase.firestore().collection('users').doc(toUserId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        const currentRating = userData.averageRating || 0;
        const totalReviews = userData.totalReviews || 0;
        const newTotal = totalReviews + 1;
        const newAverage = ((currentRating * totalReviews) + rating) / newTotal;

        await userRef.update({
            averageRating: newAverage,
            totalReviews: newTotal
        });

        return { id: docRef.id, ...reviewData };
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
}

// Get Reviews for User
async function getUserReviews(userId, callback) {
    try {
        firebase.firestore().collection('reviews')
            .where('toUser', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const reviews = [];
                snapshot.forEach((doc) => {
                    reviews.push({ id: doc.id, ...doc.data() });
                });
                callback(reviews);
            });
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Get User Services
async function getUserServices(userId, callback) {
    try {
        firebase.firestore().collection('services')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const services = [];
                snapshot.forEach((doc) => {
                    services.push({ id: doc.id, ...doc.data() });
                });
                callback(services);
            });
    } catch (error) {
        console.error('Error loading user services:', error);
    }
}

// Get User Jobs
async function getUserJobs(userId, callback) {
    try {
        firebase.firestore().collection('jobs')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const jobs = [];
                snapshot.forEach((doc) => {
                    jobs.push({ id: doc.id, ...doc.data() });
                });
                callback(jobs);
            });
    } catch (error) {
        console.error('Error loading user jobs:', error);
    }
}

// Delete Service
async function deleteService(serviceId) {
    try {
        await firebase.firestore().collection('services').doc(serviceId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting service:', error);
        throw error;
    }
}

// Delete Job
async function deleteJob(jobId) {
    try {
        await firebase.firestore().collection('jobs').doc(jobId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting job:', error);
        throw error;
    }
}

// Update Service
async function updateService(serviceId, data) {
    try {
        await firebase.firestore().collection('services').doc(serviceId).update({
            ...data,
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error updating service:', error);
        throw error;
    }
}

// Update Job
async function updateJob(jobId, data) {
    try {
        await firebase.firestore().collection('jobs').doc(jobId).update({
            ...data,
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error updating job:', error);
        throw error;
    }
}

// Initialize on document ready
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});
