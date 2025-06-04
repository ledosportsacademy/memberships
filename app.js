// API Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');

// Constants for week calculation
const WEEK_START_DATE = new Date(2025, 5, 1); // June 1st, 2025 (month is 0-based)
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PHBhdGggZmlsbD0iI2U2ZTZlNiIgZD0iTTAgMGg1MTJ2NTEySDB6Ii8+PHBhdGggZmlsbD0iIzk5OSIgZD0iTTI1NiAzMDRjNjEuNiAwIDExMi04OS40IDExMi0yMDAgMC04OC40LTUwLjQtODAtMTEyLTgwcy0xMTItOC40LTExMiA4MGMwIDExMC42IDUwLjQgMjAwIDExMiAyMDB6bS0xNiA0MGMtNjYuOCAwLTEyOCA0OC44LTEyOCAxMDguNFY1MTJoMjg4di01OS42YzAtNTkuNi02MS4yLTEwOC40LTEyOC0xMDguNHoiLz48L3N2Zz4=';

// Utility Functions
const formatDate = (date) => {
    const options = { 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
};
const formatCurrency = (amount) => `₹${parseFloat(amount).toFixed(2)}`;

const formatWeekDisplay = (weekNumber, startDate, endDate) => {
    return `Week ${weekNumber} (${formatDate(startDate)} - ${formatDate(endDate)})`;
};

const formatMemberId = (id) => {
    // Extract the numeric portion or use the index + 1
    let numericId;
    if (typeof id === 'string' && id.match(/\d+$/)) {
        numericId = parseInt(id.match(/\d+$/)[0]);
    } else {
        numericId = parseInt(id);
    }
    // Pad with zeros to make it 3 digits
    return numericId.toString().padStart(3, '0');
};

const api = {
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // Auth endpoints
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        authToken = response.token;
        localStorage.setItem('authToken', authToken);
        return response;
    },

    // Members endpoints
    async getMembers() {
        return await this.request('/members');
    },

    async addMember(data) {
        return await this.request('/members', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteMember(id) {
        return await this.request(`/members/${id}`, {
            method: 'DELETE'
        });
    },

    async updateMember(id, data) {
        return await this.request(`/members/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Payments endpoints
    async getPayments(weekNumber, year) {
        return await this.request(`/payments?weekNumber=${weekNumber}&year=${year}`);
    },

    async recordPayment(data) {
        return await this.request('/payments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getPaymentStats(weekNumber, year) {
        return await this.request(`/payments/stats?weekNumber=${weekNumber}&year=${year}`);
    },

    // Expenses endpoints
    async getExpenses() {
        return await this.request('/expenses');
    },

    async addExpense(data) {
        return await this.request('/expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteExpense(id) {
        return await this.request(`/expenses/${id}`, {
            method: 'DELETE'
        });
    },

    // Donations endpoints
    async getDonations() {
        return await this.request('/donations');
    },

    async addDonation(data) {
        return await this.request('/donations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getWeeklyAnalysis(year) {
        return await this.request(`/payments/weekly-analysis?year=${year}`);
    }
};

// DOM Elements
const adminPanel = document.getElementById('adminPanel');
const authContainer = document.getElementById('authContainer');
const authButton = document.getElementById('authButton');
const adminToggle = document.getElementById('adminToggle');
const paymentModal = document.getElementById('paymentModal');
const imageModal = document.getElementById('imageModal');
const editMemberModal = document.getElementById('editMemberModal');
const editMemberForm = document.getElementById('editMemberForm');
const modalImage = document.getElementById('modalImage');
const modalMemberName = document.getElementById('modalMemberName');
const closeModals = document.querySelectorAll('.close-modal');
const logoImage = document.querySelector('.logo img');

// Current week and year
const currentDate = new Date();
const currentWeek = getWeekNumber(currentDate);
const currentYear = currentDate.getFullYear();

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Handle logo image loading
    if (logoImage) {
        logoImage.onerror = () => {
            console.error('Error loading logo image');
            logoImage.style.display = 'none';
        };
        
        logoImage.onload = () => {
            logoImage.style.display = 'block';
        };
        
        // Try loading the logo
        const logoUrl = 'https://iili.io/F9tc8il.png';
        if (logoImage.src !== logoUrl) {
            logoImage.src = logoUrl;
        }
    }

    initWeeks();
    checkAuth();
    loadData();
    setupEventListeners();
    initYearSelector();
});

// Check if user is logged in
function checkAuth() {
    if (authToken) {
        adminPanel.style.display = 'block';
        document.getElementById('adminToggle').textContent = 'Logout';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Admin toggle
    adminToggle.addEventListener('click', () => {
        const authContainer = document.getElementById('authContainer');
        if (authToken) {
            localStorage.removeItem('authToken');
            authToken = null;
            adminPanel.style.display = 'none';
            adminToggle.textContent = 'Click to Login';
            location.reload();
        } else {
            authContainer.style.display = authContainer.style.display === 'none' ? 'block' : 'none';
            adminToggle.textContent = authContainer.style.display === 'none' ? 'Click to Login' : 'Hide Login';
        }
    });

    // Login form submission
    document.getElementById('authButton').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        try {
            await api.login(email, password);
            alert('Login successful!');
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('adminToggle').textContent = 'Logout';
            adminPanel.style.display = 'block';
            loadData();
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });

    // Close modals
    closeModals.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            paymentModal.style.display = 'none';
            imageModal.style.display = 'none';
            editMemberModal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            paymentModal.style.display = 'none';
        }
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
        if (e.target === editMemberModal) {
            editMemberModal.style.display = 'none';
        }
    });

    // Cancel edit button
    document.getElementById('cancelEdit').addEventListener('click', () => {
        editMemberModal.style.display = 'none';
    });

    // Edit member form submission
    editMemberForm.addEventListener('submit', handleEditMember);

    // Form submissions
    document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
    document.getElementById('paymentForm').addEventListener('submit', handleRecordPayment);
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
    document.getElementById('addDonationForm').addEventListener('submit', handleAddDonation);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Week selection
    document.getElementById('weeksContainer').addEventListener('click', (e) => {
        if (e.target.classList.contains('week-btn')) {
            document.querySelectorAll('.week-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadData();
        }
    });

    // Photo preview for new member
    document.getElementById('memberPhoto').addEventListener('change', function() {
        handleUrlPreview(this, 'photoPreview');
    });

    // Photo preview for edit member
    document.getElementById('editMemberPhoto').addEventListener('change', function() {
        handleUrlPreview(this, 'editPhotoPreview');
    });
}

// Switch tabs
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        }
    });
}

// Initialize weeks
function initWeeks() {
    const container = document.getElementById('weeksContainer');
    container.innerHTML = '';
    
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    
    // Calculate total weeks from start date to end of 2025
    const endOf2025 = new Date(2025, 11, 31); // December 31st, 2025
    const totalWeeks = getWeekNumber(endOf2025);

    for (let i = 1; i <= totalWeeks; i++) {
        const weekStartDate = new Date(WEEK_START_DATE);
        weekStartDate.setDate(weekStartDate.getDate() + (i - 1) * 7);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);

        const btn = document.createElement('button');
        btn.className = `week-btn ${i === currentWeek ? 'active' : ''}`;
        btn.innerHTML = `
            <div class="week-number">Week ${i}</div>
            <div class="week-dates">${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}</div>
        `;
        btn.dataset.weekNumber = i;
        container.appendChild(btn);
    }
}

// Load all data
async function loadData() {
    try {
        await Promise.all([
            loadMembers(),
            loadExpenses(),
            loadDonations(),
            updateSummaryCards()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load members
async function loadMembers() {
    try {
        const members = await api.getMembers();
        const selectedWeek = document.querySelector('.week-btn.active')?.dataset.weekNumber || currentWeek;
        const payments = await api.getPayments(selectedWeek, currentYear);
        const paidMemberIds = payments.map(p => p.member._id);
        
        // Update the members table
        renderMembers(members, paidMemberIds);
        
        // Update summary cards after loading members
        await updateSummaryCards();
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Render members
function renderMembers(members, paidMemberIds) {
    const tbody = document.querySelector('#membersTable tbody');
    tbody.innerHTML = '';

    members.forEach((member, index) => {
        const isPaid = paidMemberIds.includes(member._id);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <img src="${member.photo || DEFAULT_AVATAR}" 
                     alt="${member.name}" 
                     class="member-photo"
                     onerror="this.src='${DEFAULT_AVATAR}'"
                     data-name="${member.name}"
                     data-original-photo="${member.photo || ''}">
            </td>
            <td>${formatMemberId(index + 1)}</td>
            <td>${member.name}</td>
            <td>${member.phone}</td>
            <td><span class="badge ${isPaid ? 'badge-success' : 'badge-danger'}">${isPaid ? 'Paid' : 'Unpaid'}</span></td>
            <td>
                ${authToken ? `
                    <button class="btn btn-sm btn-primary edit-member-btn" data-id="${member._id}">Edit</button>
                    <button class="btn btn-sm btn-success mark-paid-btn" data-id="${member._id}">${isPaid ? 'Edit Pay' : 'Pay'}</button>
                    <button class="btn btn-sm btn-danger delete-member-btn" data-id="${member._id}">Delete</button>
                ` : ''}
            </td>
        `;

        // Add click event for member photo
        const memberPhotoElement = row.querySelector('.member-photo');
        memberPhotoElement.addEventListener('click', (e) => {
            const originalPhoto = e.target.dataset.originalPhoto;
            modalImage.src = originalPhoto || DEFAULT_AVATAR;
            modalMemberName.textContent = e.target.dataset.name;
            imageModal.style.display = 'flex';
            
            // Handle image load error in modal
            modalImage.onerror = () => {
                modalImage.src = DEFAULT_AVATAR;
            };
        });

        if (authToken) {
            // Add edit button click handler
            row.querySelector('.edit-member-btn').addEventListener('click', () => {
                openEditModal(member);
            });

            // Existing payment button click handler
            row.querySelector('.mark-paid-btn').addEventListener('click', () => {
                document.getElementById('paymentMemberId').value = member._id;
                document.getElementById('paymentAmountModal').value = document.getElementById('paymentAmount').value;
                document.getElementById('paymentWeek').value = currentWeek;
                document.getElementById('paymentYear').value = currentYear;
                paymentModal.style.display = 'flex';
            });

            // Existing delete button click handler
            row.querySelector('.delete-member-btn').addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this member?')) {
                    await handleDeleteMember(member._id);
                }
            });
        }

        tbody.appendChild(row);
    });
}

// Handle URL preview
function handleUrlPreview(input, previewId) {
    const preview = document.getElementById(previewId);
    const url = input.value.trim();

    if (url) {
        preview.src = url;
        preview.onerror = function() {
            preview.src = DEFAULT_AVATAR;
            alert('Invalid image URL. Please enter a valid image URL.');
        };
    } else {
        preview.src = DEFAULT_AVATAR;
    }
}

// Handle add member
async function handleAddMember(e) {
    e.preventDefault();
    const name = document.getElementById('memberName').value;
    const phone = document.getElementById('memberPhone').value;
    const photoUrl = document.getElementById('memberPhoto').value.trim();

    try {
        await api.addMember({ 
            name, 
            phone, 
            photo: photoUrl || null
        });

        alert('Member added successfully!');
        document.getElementById('addMemberForm').reset();
        document.getElementById('photoPreview').src = DEFAULT_AVATAR;
        loadMembers();
        updateSummaryCards();
    } catch (error) {
        alert('Error adding member: ' + error.message);
    }
}

// Handle delete member
async function handleDeleteMember(id) {
    try {
        await api.deleteMember(id);
        alert('Member deleted successfully!');
        loadMembers();
        updateSummaryCards();
    } catch (error) {
        alert('Error deleting member: ' + error.message);
    }
}

// Handle record payment
async function handleRecordPayment(e) {
    e.preventDefault();
    const memberId = document.getElementById('paymentMemberId').value;
    const amount = parseFloat(document.getElementById('paymentAmountModal').value);
    const weekNumber = parseInt(document.getElementById('paymentWeek').value);
    const year = 2025; // Fixed year as 2025

    try {
        await api.recordPayment({ member: memberId, amount, weekNumber, year });
        alert('Payment recorded successfully!');
        paymentModal.style.display = 'none';
        loadMembers();
        updateSummaryCards();
    } catch (error) {
        alert('Error recording payment: ' + error.message);
    }
}

// Load expenses
async function loadExpenses() {
    try {
        const expenses = await api.getExpenses();
        renderExpenses(expenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Render expenses
function renderExpenses(expenses) {
    const tbody = document.querySelector('#expensesTable tbody');
    tbody.innerHTML = '';

    expenses.forEach(expense => {
        const row = document.createElement('tr');
        const date = formatDate(expense.createdAt);
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${expense.description}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>
                ${authToken ? `<button class="btn btn-sm btn-danger delete-expense-btn" data-id="${expense._id}">Delete</button>` : ''}
            </td>
        `;

        if (authToken) {
            row.querySelector('.delete-expense-btn').addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this expense?')) {
                    await handleDeleteExpense(expense._id);
                }
            });
        }

        tbody.appendChild(row);
    });
}

// Handle add expense
async function handleAddExpense(e) {
    e.preventDefault();
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);

    try {
        await api.addExpense({ description, amount });
        alert('Expense added successfully!');
        document.getElementById('addExpenseForm').reset();
        loadExpenses();
        updateSummaryCards();
    } catch (error) {
        alert('Error adding expense: ' + error.message);
    }
}

// Handle delete expense
async function handleDeleteExpense(id) {
    try {
        await api.deleteExpense(id);
        alert('Expense deleted successfully!');
        loadExpenses();
        updateSummaryCards();
    } catch (error) {
        alert('Error deleting expense: ' + error.message);
    }
}

// Load donations
async function loadDonations() {
    try {
        const donations = await api.getDonations();
        renderDonations(donations);
    } catch (error) {
        console.error('Error loading donations:', error);
    }
}

// Render donations
function renderDonations(donations) {
    const tbody = document.querySelector('#donationsTable tbody');
    tbody.innerHTML = '';

    donations.forEach(donation => {
        const row = document.createElement('tr');
        const date = formatDate(donation.createdAt);
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${donation.donorName}</td>
            <td>${formatCurrency(donation.amount)}</td>
        `;

        tbody.appendChild(row);
    });
}

// Handle add donation
async function handleAddDonation(e) {
    e.preventDefault();
    const donorName = document.getElementById('donorName').value;
    const amount = parseFloat(document.getElementById('donationAmount').value);

    try {
        await api.addDonation({ donorName, amount });
        alert('Donation recorded successfully!');
        document.getElementById('addDonationForm').reset();
        loadDonations();
        updateSummaryCards();
    } catch (error) {
        alert('Error recording donation: ' + error.message);
    }
}

// Update summary cards
async function updateSummaryCards() {
    try {
        const selectedWeek = document.querySelector('.week-btn.active')?.dataset.weekNumber || currentWeek;
        const stats = await api.getPaymentStats(selectedWeek, 2025); // Fixed year as 2025
        
        // Get all members first
        const members = await api.getMembers();
        const totalMembers = members.length; // Get actual count of members

        // Update total members
        document.getElementById('totalMembers').textContent = totalMembers;
        
        // Update paid members this week
        const paidThisWeek = stats.weeklyPaidCount || 0;
        document.getElementById('paidThisWeek').textContent = paidThisWeek;
        
        // Calculate unpaid members (total members minus paid members)
        const unpaidThisWeek = totalMembers - paidThisWeek;
        document.getElementById('unpaidThisWeek').textContent = unpaidThisWeek;
        
        // Update total collected
        document.getElementById('totalCollected').textContent = formatCurrency(stats.totalCollected || 0);
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

// Helper function to get week number
function getWeekNumber(date) {
    const diffTime = Math.abs(date - WEEK_START_DATE);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
}

// Generate and download PDF report
async function generatePDF(analysisData, summaryData) {
    try {
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text('LEDO Sports Academy', 105, 15, { align: 'center' });
        doc.setFontSize(16);
        doc.text('Weekly Analysis Report', 105, 25, { align: 'center' });

        // Add period
        const month = document.getElementById('analysisMonth').value;
        const year = document.getElementById('analysisYear').value;
        const period = month === 'all' ? `Year ${year}` : 
                      `${new Date(2025, parseInt(month), 1).toLocaleString('default', { month: 'long' })} ${year}`;
        doc.setFontSize(12);
        doc.text(`Period: ${period}`, 105, 35, { align: 'center' });

        // Add summary section
        doc.setFontSize(14);
        doc.text('Summary', 14, 45);

        // Create summary table data
        const summaryTableData = [
            ['Total Collections', formatCurrency(summaryData.totalCollected)],
            ['Total Expenses', formatCurrency(summaryData.totalExpenses)],
            ['Net Amount', formatCurrency(summaryData.netAmount)],
            ['Average Weekly Collection', formatCurrency(summaryData.averageWeeklyCollection)]
        ];

        // Add summary table
        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Amount']],
            body: summaryTableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // Add weekly breakdown title
        doc.setFontSize(14);
        doc.text('Weekly Breakdown', 14, doc.lastAutoTable.finalY + 15);

        // Prepare weekly data
        const weeklyTableData = analysisData.map(week => {
            const weekStartDate = new Date(WEEK_START_DATE);
            weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            return [
                `Week ${week.weekNumber}\n${formatDate(weekStartDate)}\n${formatDate(weekEndDate)}`,
                formatCurrency(week.totalCollected),
                week.membersPaid.toString(),
                formatCurrency(week.expenses),
                formatCurrency(week.netAmount)
            ];
        });

        // Add weekly breakdown table with improved formatting
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Week', 'Collections', 'Members Paid', 'Expenses', 'Net Amount']],
            body: weeklyTableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            styles: { 
                fontSize: 10, 
                cellPadding: 5,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 55, fontStyle: 'bold' },
                1: { cellWidth: 35, halign: 'right' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' }
            },
            didParseCell: function(data) {
                if (data.column.index === 0) {
                    data.cell.styles.cellPadding = { top: 4, right: 4, bottom: 4, left: 4 };
                }
            }
        });

        // Add footer with generation timestamp
        const today = new Date();
        doc.setFontSize(10);
        doc.text(
            `Generated on: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`,
            14,
            doc.internal.pageSize.height - 10
        );

        // Save the PDF
        const fileName = `LEDO-Sports-Academy-Analysis-${period.replace(/\s+/g, '-')}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// Initialize year selector and analysis filters
function initYearSelector() {
    const select = document.getElementById('analysisYear');
    const monthSelect = document.getElementById('analysisMonth');
    const downloadBtn = document.getElementById('downloadAnalysisBtn');
    
    // Set initial year
    select.innerHTML = '<option value="2025">2025</option>';
    
    // Load initial analysis
    loadWeeklyAnalysis(2025, 'all');

    // Add change event listeners
    select.addEventListener('change', (e) => {
        loadWeeklyAnalysis(parseInt(e.target.value), monthSelect.value);
    });

    monthSelect.addEventListener('change', (e) => {
        loadWeeklyAnalysis(parseInt(select.value), e.target.value);
    });

    // Add download button event listener with error handling
    downloadBtn.addEventListener('click', () => {
        try {
            if (!window.currentAnalysisData || !window.currentSummaryData) {
                throw new Error('Analysis data not available');
            }
            generatePDF(window.currentAnalysisData, window.currentSummaryData);
        } catch (error) {
            console.error('Error handling PDF download:', error);
            alert('Unable to generate PDF. Please make sure data is loaded and try again.');
        }
    });
}

// Load weekly analysis data
async function loadWeeklyAnalysis(year = 2025, month = 'all') {
    try {
        const data = await api.getWeeklyAnalysis(year);
        
        // Filter data by month if needed
        let filteredAnalysis = data.weeklyAnalysis;
        if (month !== 'all') {
            filteredAnalysis = data.weeklyAnalysis.filter(week => {
                const weekStartDate = new Date(WEEK_START_DATE);
                weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);
                return weekStartDate.getMonth() === parseInt(month);
            });
        }

        // Calculate summary for filtered data
        const summary = {
            totalCollected: filteredAnalysis.reduce((sum, week) => sum + week.totalCollected, 0),
            totalExpenses: filteredAnalysis.reduce((sum, week) => sum + week.expenses, 0),
            netAmount: filteredAnalysis.reduce((sum, week) => sum + week.netAmount, 0),
            averageWeeklyCollection: filteredAnalysis.reduce((sum, week) => sum + week.totalCollected, 0) / 
                                   (filteredAnalysis.length || 1)
        };

        // Store current data for PDF generation
        window.currentAnalysisData = filteredAnalysis;
        window.currentSummaryData = summary;

        // Update summary
        document.getElementById('analysisTotalCollections').textContent = formatCurrency(summary.totalCollected);
        document.getElementById('analysisTotalExpenses').textContent = formatCurrency(summary.totalExpenses);
        document.getElementById('analysisNetAmount').textContent = formatCurrency(summary.netAmount);
        document.getElementById('analysisAvgCollection').textContent = formatCurrency(summary.averageWeeklyCollection);

        // Update table
        const tbody = document.querySelector('#analysisTable tbody');
        tbody.innerHTML = '';

        filteredAnalysis.forEach(week => {
            const weekStartDate = new Date(WEEK_START_DATE);
            weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    Week ${week.weekNumber}
                    <br>
                    <small>${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}</small>
                </td>
                <td>${formatCurrency(week.totalCollected)}</td>
                <td>${week.membersPaid}</td>
                <td>${formatCurrency(week.expenses)}</td>
                <td class="${week.netAmount >= 0 ? 'positive-amount' : 'negative-amount'}">
                    ${formatCurrency(week.netAmount)}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Show no data message if needed
        if (filteredAnalysis.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        No data available for the selected month
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading weekly analysis:', error);
    }
}

// Handle edit member
async function handleEditMember(e) {
    e.preventDefault();
    const memberId = document.getElementById('editMemberId').value;
    const name = document.getElementById('editMemberName').value;
    const phone = document.getElementById('editMemberPhone').value;
    const photoUrl = document.getElementById('editMemberPhoto').value.trim();

    try {
        const updateData = {
            name,
            phone,
            photo: photoUrl || null
        };

        await api.updateMember(memberId, updateData);
        alert('Member details updated successfully!');
        editMemberModal.style.display = 'none';
        loadMembers();
    } catch (error) {
        alert('Error updating member: ' + error.message);
    }
}

// Open edit modal with member data
function openEditModal(member) {
    document.getElementById('editMemberId').value = member._id;
    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberPhone').value = member.phone;
    document.getElementById('editMemberPhoto').value = member.photo || '';
    document.getElementById('editPhotoPreview').src = member.photo || DEFAULT_AVATAR;
    editMemberModal.style.display = 'flex';
} 