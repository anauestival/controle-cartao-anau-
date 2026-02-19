// ============================================
// INICIALIZAÇÃO E CONFIGURAÇÃO
// ============================================

let db;
const DB_NAME = 'CartaoAnaueBD';
const DB_VERSION = 1;

// Inicializar banco de dados
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Tabela de Cartões
            if (!db.objectStoreNames.contains('cards')) {
                const cardStore = db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
                cardStore.createIndex('name', 'name', { unique: false });
            }

            // Tabela de Registros (Lançamentos)
            if (!db.objectStoreNames.contains('records')) {
                const recordStore = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
                recordStore.createIndex('cardId', 'cardId', { unique: false });
                recordStore.createIndex('year', 'year', { unique: false });
                recordStore.createIndex('month', 'month', { unique: false });
                recordStore.createIndex('classification', 'classification', { unique: false });
                recordStore.createIndex('person', 'person', { unique: false });
                recordStore.createIndex('parentId', 'parentId', { unique: false });
            }
        };
    });
}

// ============================================
// OPERAÇÕES COM CARTÕES
// ============================================

function addCard(name, dueDay) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cards'], 'readwrite');
        const store = transaction.objectStore('cards');
        const request = store.add({ name, dueDay, createdAt: new Date().toISOString() });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function getCards() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cards'], 'readonly');
        const store = transaction.objectStore('cards');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function getCardById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cards'], 'readonly');
        const store = transaction.objectStore('cards');
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function updateCard(id, name, dueDay) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cards'], 'readwrite');
        const store = transaction.objectStore('cards');
        const request = store.put({ id, name, dueDay, updatedAt: new Date().toISOString() });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function deleteCard(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cards'], 'readwrite');
        const store = transaction.objectStore('cards');
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// ============================================
// OPERAÇÕES COM REGISTROS (LANÇAMENTOS)
// ============================================

function addRecord(record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['records'], 'readwrite');
        const store = transaction.objectStore('records');
        const request = store.add(record);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function getRecords() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['records'], 'readonly');
        const store = transaction.objectStore('records');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function getRecordById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['records'], 'readonly');
        const store = transaction.objectStore('records');
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function updateRecord(id, updates) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['records'], 'readwrite');
        const store = transaction.objectStore('records');
        
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const record = getRequest.result;
            const updated = { ...record, ...updates, updatedAt: new Date().toISOString() };
            const putRequest = store.put(updated);
            
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve(putRequest.result);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

function deleteRecord(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['records'], 'readwrite');
        const store = transaction.objectStore('records');
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function deleteRecordsByParentId(parentId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['records'], 'readwrite');
        const store = transaction.objectStore('records');
        const index = store.index('parentId');
        const range = IDBKeyRange.only(parentId);
        const request = index.openCursor(range);
        let count = 0;

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                count++;
                cursor.continue();
            } else {
                resolve(count);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// ============================================
// LÓGICA DE LANÇAMENTO COM PARCELAS
// ============================================

async function launchPurchase(cardId, purchaseDate, description, classification, totalAmount, installments, person) {
    try {
        // Converter data DD/MM/YYYY para Date
        let date;
        if (purchaseDate.includes('/')) {
            const [day, month, year] = purchaseDate.split('/').map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(purchaseDate);
        }
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const card = await getCardById(cardId);

        if (!card) {
            throw new Error('Cartão não encontrado');
        }

        const valuePerInstallment = parseFloat((totalAmount / installments).toFixed(2));
        const parentId = Date.now(); // ID único para agrupar parcelas

        for (let i = 1; i <= installments; i++) {
            // Calcular mês e ano da parcela
            let installmentDate = new Date(year, month - 1 + (i - 1), 1);
            const installmentYear = installmentDate.getFullYear();
            const installmentMonth = installmentDate.getMonth() + 1;

            const record = {
                year: installmentYear,
                month: installmentMonth,
                cardId: cardId,
                cardName: card.name,
                vencimento: card.dueDay,
                data: purchaseDate,
                descricao: description,
                classificacao: classification,
                valorTotal: totalAmount,
                parcAtual: i,
                qtdParcela: installments,
                valorParcela: valuePerInstallment,
                quem: person,
                parentId: parentId,
                createdAt: new Date().toISOString()
            };

            await addRecord(record);
        }

        showToast(`Compra lançada com sucesso! ${installments} parcela(s) criada(s).`, 'success');
        return parentId;
    } catch (error) {
        console.error('Erro ao lançar compra:', error);
        showToast('Erro ao lançar compra', 'error');
        throw error;
    }
}

// ============================================
// FILTROS E CONSULTAS
// ============================================

async function getFilteredRecords(filters = {}) {
    const records = await getRecords();
    
    return records.filter(record => {
        if (filters.year && record.year !== parseInt(filters.year)) return false;
        if (filters.month && record.month !== parseInt(filters.month)) return false;
        if (filters.cardId && record.cardId !== parseInt(filters.cardId)) return false;
        if (filters.classification && record.classificacao !== filters.classification) return false;
        if (filters.person && record.quem !== filters.person) return false;
        return true;
    });
}

async function getUniquePeople() {
    const records = await getRecords();
    const people = [...new Set(records.map(r => r.quem))];
    return people.sort();
}

async function getUniqueYears() {
    const records = await getRecords();
    const years = [...new Set(records.map(r => r.year))];
    return years.sort((a, b) => b - a);
}

// ============================================
// CÁLCULOS E TOTAIS
// ============================================

async function calculateTotals() {
    const records = await getRecords();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Total do mês atual
    const monthRecords = records.filter(r => r.year === currentYear && r.month === currentMonth);
    const totalMonth = monthRecords.reduce((sum, r) => sum + r.valorParcela, 0);

    // Total por cartão (mês atual)
    const cardTotals = {};
    monthRecords.forEach(r => {
        if (!cardTotals[r.cardId]) {
            cardTotals[r.cardId] = { name: r.cardName, total: 0 };
        }
        cardTotals[r.cardId].total += r.valorParcela;
    });

    // Total por pessoa (mês atual)
    const personTotals = {};
    monthRecords.forEach(r => {
        if (!personTotals[r.quem]) {
            personTotals[r.quem] = 0;
        }
        personTotals[r.quem] += r.valorParcela;
    });

    return {
        totalMonth,
        cardTotals,
        personTotals,
        monthRecords
    };
}

async function getMonthlyTotals() {
    const records = await getRecords();
    const totals = {};

    records.forEach(r => {
        const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
        if (!totals[key]) {
            totals[key] = 0;
        }
        totals[key] += r.valorParcela;
    });

    return totals;
}

async function getCardTotals() {
    const records = await getRecords();
    const totals = {};

    records.forEach(r => {
        if (!totals[r.cardId]) {
            totals[r.cardId] = { name: r.cardName, total: 0 };
        }
        totals[r.cardId].total += r.valorParcela;
    });

    return totals;
}

async function getPersonTotals() {
    const records = await getRecords();
    const totals = {};

    records.forEach(r => {
        if (!totals[r.quem]) {
            totals[r.quem] = 0;
        }
        totals[r.quem] += r.valorParcela;
    });

    return totals;
}

// ============================================
// FORMATAÇÃO
// ============================================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Se estiver em formato DD/MM/YYYY, converter
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
    }
    
    // Se estiver em formato YYYY-MM-DD
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function getMonthName(month) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[month - 1];
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// NAVEGAÇÃO
// ============================================

function switchTab(tabName) {
    // Ocultar todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Remover ativo de todos os tabs
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
    });

    // Ativar tela e tab
    const screen = document.getElementById(tabName);
    if (screen) {
        screen.classList.add('active');
    }

    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    if (tab) {
        tab.classList.add('active');
    }

    // Atualizar conteúdo da tela
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'purchase') {
        updatePurchaseForm();
    } else if (tabName === 'query') {
        updateQueryFilters();
        updateQueryRecords();
    } else if (tabName === 'cards') {
        updateCardsList();
    }
}

// ============================================
// DASHBOARD
// ============================================

async function updateDashboard() {
    try {
        const totals = await calculateTotals();
        const monthlyTotals = await getMonthlyTotals();
        const cardTotals = await getCardTotals();
        const personTotals = await getPersonTotals();

        // Atualizar cards de resumo
        document.getElementById('totalMonth').textContent = formatCurrency(totals.totalMonth);
        
        const totalCard = Object.values(totals.cardTotals).reduce((sum, c) => sum + c.total, 0);
        document.getElementById('totalCard').textContent = formatCurrency(totalCard);
        
        const totalPerson = Object.values(totals.personTotals).reduce((sum, p) => sum + p, 0);
        document.getElementById('totalPerson').textContent = formatCurrency(totalPerson);

        // Totais por mês
        const monthTotalsHtml = Object.entries(monthlyTotals)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 12)
            .map(([month, total]) => `
                <div class="total-item">
                    <span class="total-item-label">${month}</span>
                    <span class="total-item-value">${formatCurrency(total)}</span>
                </div>
            `).join('');
        document.getElementById('monthTotals').innerHTML = monthTotalsHtml || '<p>Sem dados</p>';

        // Totais por cartão
        const cardTotalsHtml = Object.entries(cardTotals)
            .map(([cardId, data]) => `
                <div class="total-item">
                    <span class="total-item-label">${data.name}</span>
                    <span class="total-item-value">${formatCurrency(data.total)}</span>
                </div>
            `).join('');
        document.getElementById('cardTotals').innerHTML = cardTotalsHtml || '<p>Sem dados</p>';

        // Totais por pessoa
        const personTotalsHtml = Object.entries(personTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([person, total]) => `
                <div class="total-item">
                    <span class="total-item-label">${person}</span>
                    <span class="total-item-value">${formatCurrency(total)}</span>
                </div>
            `).join('');
        document.getElementById('personTotals').innerHTML = personTotalsHtml || '<p>Sem dados</p>';

        // Gráfico
        drawSpendChart(monthlyTotals);
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
    }
}

function drawSpendChart(monthlyTotals) {
    const canvas = document.getElementById('spendChart');
    const ctx = canvas.getContext('2d');

    // Preparar dados dos últimos 6 meses
    const now = new Date();
    const months = [];
    const values = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push(getMonthName(date.getMonth() + 1));
        values.push(monthlyTotals[key] || 0);
    }

    // Limpar canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = 250;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...values, 1000);
    const barWidth = chartWidth / values.length;

    // Desenhar eixos
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Desenhar barras
    values.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * barWidth + barWidth * 0.1;
        const y = canvas.height - padding - barHeight;
        const width = barWidth * 0.8;

        // Barra
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(x, y, width, barHeight);

        // Valor no topo
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formatCurrency(value), x + width / 2, y - 5);

        // Mês na base
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(months[index], x + width / 2, canvas.height - padding + 20);
    });
}

// ============================================
// LANÇAR COMPRA
// ============================================

async function updatePurchaseForm() {
    try {
        const cards = await getCards();
        const select = document.getElementById('purchaseCard');
        
        select.innerHTML = '<option value="">Selecione um cartão</option>';
        cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.name;
            select.appendChild(option);
        });

        // Definir data atual
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
    } catch (error) {
        console.error('Erro ao atualizar formulário de compra:', error);
    }
}

document.getElementById('purchaseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const cardId = parseInt(document.getElementById('purchaseCard').value);
        const purchaseDate = document.getElementById('purchaseDate').value;
        const description = document.getElementById('purchaseDescription').value;
        const classification = document.getElementById('purchaseClassification').value;
        const amount = parseFloat(document.getElementById('purchaseAmount').value);
        const installments = parseInt(document.getElementById('purchaseInstallments').value);
        const person = document.getElementById('purchasePerson').value;

        if (!cardId || !purchaseDate || !description || !classification || amount <= 0 || installments < 1 || !person) {
            showToast('Preencha todos os campos corretamente', 'error');
            return;
        }

        await launchPurchase(cardId, purchaseDate, description, classification, amount, installments, person);

        // Limpar formulário
        document.getElementById('purchaseForm').reset();
        updatePurchaseForm();
        switchTab('dashboard');
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao lançar compra', 'error');
    }
});

// ============================================
// CONSULTA
// ============================================

async function updateQueryFilters() {
    try {
        const cards = await getCards();
        const years = await getUniqueYears();
        const people = await getUniquePeople();

        // Atualizar select de cartões
        const cardSelect = document.getElementById('filterCard');
        cardSelect.innerHTML = '<option value="">Todos</option>';
        cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.name;
            cardSelect.appendChild(option);
        });

        // Atualizar select de anos
        const yearSelect = document.getElementById('filterYear');
        yearSelect.innerHTML = '<option value="">Todos</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        // Atualizar select de pessoas
        const personSelect = document.getElementById('filterPerson');
        personSelect.innerHTML = '<option value="">Todos</option>';
        people.forEach(person => {
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            personSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao atualizar filtros:', error);
    }
}

async function updateQueryRecords() {
    try {
        const filters = {
            year: document.getElementById('filterYear').value,
            month: document.getElementById('filterMonth').value,
            cardId: document.getElementById('filterCard').value,
            classification: document.getElementById('filterClassification').value,
            person: document.getElementById('filterPerson').value
        };

        const records = await getFilteredRecords(filters);
        const total = records.reduce((sum, r) => sum + r.valorParcela, 0);

        // Atualizar total filtrado
        document.getElementById('filteredTotal').textContent = formatCurrency(total);

        // Renderizar registros
        const recordsList = document.getElementById('recordsList');
        if (records.length === 0) {
            recordsList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhum registro encontrado</p>';
            return;
        }

        recordsList.innerHTML = records.map(record => `
            <div class="record-item ${selectedRecordsForDelete.has(record.id) ? 'selected' : ''}" ${deleteMode ? `onclick="toggleRecordSelection(${record.id})"` : `onclick="openEditModal(${record.id})"`}>
                ${deleteMode ? `<div class="record-checkbox"><input type="checkbox" ${selectedRecordsForDelete.has(record.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleRecordSelection(${record.id})"></div>` : ''}
                <div class="record-header">
                    <div class="record-title">${record.descricao}</div>
                    <div class="record-date">${formatDate(record.data)}</div>
                </div>
                <div class="record-details">
                    <div class="record-detail">
                        <span class="record-detail-label">Cartão</span>
                        <span class="record-detail-value">${record.cardName}</span>
                    </div>
                    <div class="record-detail">
                        <span class="record-detail-label">Classificação</span>
                        <span class="record-detail-value">${record.classificacao}</span>
                    </div>
                    <div class="record-detail">
                        <span class="record-detail-label">Responsável</span>
                        <span class="record-detail-value">${record.quem}</span>
                    </div>
                    <div class="record-detail">
                        <span class="record-detail-label">Período</span>
                        <span class="record-detail-value">${record.month}/${record.year}</span>
                    </div>
                </div>
                <div class="record-amount">${formatCurrency(record.valorParcela)}</div>
                <div class="record-installment">Parcela ${record.parcAtual}/${record.qtdParcela}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao atualizar registros:', error);
    }
}

// Eventos de filtro
document.getElementById('filterYear')?.addEventListener('change', updateQueryRecords);
document.getElementById('filterMonth')?.addEventListener('change', updateQueryRecords);
document.getElementById('filterCard')?.addEventListener('change', updateQueryRecords);
document.getElementById('filterClassification')?.addEventListener('change', updateQueryRecords);
document.getElementById('filterPerson')?.addEventListener('change', updateQueryRecords);

document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterCard').value = '';
    document.getElementById('filterClassification').value = '';
    document.getElementById('filterPerson').value = '';
    updateQueryRecords();
});

// ============================================
// MODAL DE EDIÇÃO
// ============================================

let currentEditRecordId = null;

async function openEditModal(recordId) {
    try {
        const record = await getRecordById(recordId);
        if (!record) return;

        currentEditRecordId = recordId;
        document.getElementById('editRecordId').value = recordId;
        document.getElementById('editDate').value = record.data;
        document.getElementById('editDescription').value = record.descricao;
        document.getElementById('editClassification').value = record.classificacao;
        document.getElementById('editAmount').value = record.valorParcela;
        document.getElementById('editPerson').value = record.quem;

        document.getElementById('editModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
    }
}

document.getElementById('closeEditModal')?.addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const recordId = parseInt(document.getElementById('editRecordId').value);
        const updates = {
            data: document.getElementById('editDate').value,
            descricao: document.getElementById('editDescription').value,
            classificacao: document.getElementById('editClassification').value,
            valorParcela: parseFloat(document.getElementById('editAmount').value),
            quem: document.getElementById('editPerson').value
        };

        await updateRecord(recordId, updates);
        showToast('Registro atualizado com sucesso', 'success');
        document.getElementById('editModal').classList.remove('active');
        updateQueryRecords();
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        showToast('Erro ao atualizar registro', 'error');
    }
});

document.getElementById('deleteRecordBtn')?.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja deletar este registro?')) return;

    try {
        const recordId = parseInt(document.getElementById('editRecordId').value);
        const record = await getRecordById(recordId);

        // Se for primeira parcela, deletar todas as parcelas relacionadas
        if (record.parcAtual === 1 && record.qtdParcela > 1) {
            if (confirm('Deseja deletar todas as parcelas desta compra?')) {
                await deleteRecordsByParentId(record.parentId);
                showToast('Compra deletada com sucesso', 'success');
            } else {
                await deleteRecord(recordId);
                showToast('Parcela deletada com sucesso', 'success');
            }
        } else {
            await deleteRecord(recordId);
            showToast('Registro deletado com sucesso', 'success');
        }

        document.getElementById('editModal').classList.remove('active');
        updateQueryRecords();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showToast('Erro ao deletar registro', 'error');
    }
});

// ============================================
// CARTÕES
// ============================================

async function updateCardsList() {
    try {
        const cards = await getCards();
        const cardsList = document.getElementById('cardsList');

        if (cards.length === 0) {
            cardsList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhum cartão cadastrado</p>';
            return;
        }

        cardsList.innerHTML = cards.map(card => `
            <div class="card-item" onclick="openCardModal(${card.id})">
                <div class="card-item-header">
                    <div class="card-item-name">${card.name}</div>
                </div>
                <div class="card-item-info">
                    <div>
                        <div class="card-item-info-label">Dia de Vencimento</div>
                        <div class="card-item-info-value">Dia ${card.dueDay}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao atualizar lista de cartões:', error);
    }
}

let currentCardId = null;

document.getElementById('addCardBtn')?.addEventListener('click', () => {
    currentCardId = null;
    document.getElementById('cardId').value = '';
    document.getElementById('cardName').value = '';
    document.getElementById('cardDueDay').value = '';
    document.getElementById('cardModalTitle').textContent = 'Novo Cartão';
    document.getElementById('deleteCardBtn').style.display = 'none';
    document.getElementById('cardModal').classList.add('active');
});

async function openCardModal(cardId) {
    try {
        const card = await getCardById(cardId);
        if (!card) return;

        currentCardId = cardId;
        document.getElementById('cardId').value = cardId;
        document.getElementById('cardName').value = card.name;
        document.getElementById('cardDueDay').value = card.dueDay;
        document.getElementById('cardModalTitle').textContent = 'Editar Cartão';
        document.getElementById('deleteCardBtn').style.display = 'flex';
        document.getElementById('cardModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao abrir modal de cartão:', error);
    }
}

document.getElementById('closeCardModal')?.addEventListener('click', () => {
    document.getElementById('cardModal').classList.remove('active');
});

document.getElementById('cardForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const cardId = document.getElementById('cardId').value;
        const name = document.getElementById('cardName').value;
        const dueDay = parseInt(document.getElementById('cardDueDay').value);

        if (!name || dueDay < 1 || dueDay > 31) {
            showToast('Preencha os campos corretamente', 'error');
            return;
        }

        if (cardId) {
            await updateCard(parseInt(cardId), name, dueDay);
            showToast('Cartão atualizado com sucesso', 'success');
        } else {
            await addCard(name, dueDay);
            showToast('Cartão adicionado com sucesso', 'success');
        }

        document.getElementById('cardModal').classList.remove('active');
        updateCardsList();
        updatePurchaseForm();
        updateQueryFilters();
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao salvar cartão', 'error');
    }
});

document.getElementById('deleteCardBtn')?.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja deletar este cartão?')) return;

    try {
        const cardId = parseInt(document.getElementById('cardId').value);
        await deleteCard(cardId);
        showToast('Cartão deletado com sucesso', 'success');
        document.getElementById('cardModal').classList.remove('active');
        updateCardsList();
        updatePurchaseForm();
        updateQueryFilters();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showToast('Erro ao deletar cartão', 'error');
    }
});

// ============================================
// EXPORTAÇÃO DE DADOS
// ============================================

let selectedRecordsForDelete = new Set();
let deleteMode = false;

function toggleDeleteMode() {
    deleteMode = !deleteMode;
    const trashBtn = document.getElementById('trashBtn');
    const recordsList = document.getElementById('recordsList');
    
    if (deleteMode) {
        trashBtn.classList.add('active');
        recordsList.classList.add('delete-mode');
        document.getElementById('deleteActionBar').style.display = 'flex';
        selectedRecordsForDelete.clear();
        updateQueryRecords();
    } else {
        trashBtn.classList.remove('active');
        recordsList.classList.remove('delete-mode');
        document.getElementById('deleteActionBar').style.display = 'none';
        selectedRecordsForDelete.clear();
        updateQueryRecords();
    }
}

function toggleRecordSelection(recordId) {
    if (selectedRecordsForDelete.has(recordId)) {
        selectedRecordsForDelete.delete(recordId);
    } else {
        selectedRecordsForDelete.add(recordId);
    }
    document.getElementById('selectedCount').textContent = `${selectedRecordsForDelete.size} selecionados`;
    updateQueryRecords();
}

async function deleteSelectedRecords() {
    if (selectedRecordsForDelete.size === 0) {
        showToast('Selecione registros para deletar', 'warning');
        return;
    }
    
    if (!confirm(`Deletar ${selectedRecordsForDelete.size} registro(s)? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        for (const recordId of selectedRecordsForDelete) {
            await deleteRecord(recordId);
        }
        showToast(`${selectedRecordsForDelete.size} registro(s) deletado(s) com sucesso`, 'success');
        selectedRecordsForDelete.clear();
        deleteMode = false;
        updateQueryRecords();
        updateDashboard();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showToast('Erro ao deletar registros', 'error');
    }
}

function exportToCSV() {
    const records = Array.from(document.querySelectorAll('.record-item')).map((el, idx) => {
        // Extrair dados do elemento
        return {
            descricao: el.querySelector('.record-title')?.textContent || '',
            data: el.querySelector('.record-date')?.textContent || '',
            valor: el.querySelector('.record-amount')?.textContent || ''
        };
    });
    
    if (records.length === 0) {
        showToast('Nenhum registro para exportar', 'warning');
        return;
    }
    
    getFilteredRecords({
        year: document.getElementById('filterYear').value,
        month: document.getElementById('filterMonth').value,
        cardId: document.getElementById('filterCard').value,
        classification: document.getElementById('filterClassification').value,
        person: document.getElementById('filterPerson').value
    }).then(records => {
        let csv = 'ANO,MÊS,CARTÃO,VENCIMENTO,DATA,DESCRIÇÃO,CLASSIFICAÇÃO,VALOR TOTAL,PARC. ATUAL,QTD PARCELA,VALOR PARCELA,RESPONSÁVEL\n';
        
        records.forEach(r => {
            csv += `${r.year},${r.month},${r.cardName},${r.vencimento},${r.data},"${r.descricao}",${r.classificacao},${r.valorTotal},${r.parcAtual},${r.qtdParcela},${r.valorParcela},${r.quem}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `controle-cartao-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast('Exportado para CSV com sucesso', 'success');
    });
}

function exportToExcel() {
    getFilteredRecords({
        year: document.getElementById('filterYear').value,
        month: document.getElementById('filterMonth').value,
        cardId: document.getElementById('filterCard').value,
        classification: document.getElementById('filterClassification').value,
        person: document.getElementById('filterPerson').value
    }).then(records => {
        if (records.length === 0) {
            showToast('Nenhum registro para exportar', 'warning');
            return;
        }
        
        let html = '<table border="1"><tr><th>ANO</th><th>MÊS</th><th>CARTÃO</th><th>VENCIMENTO</th><th>DATA</th><th>DESCRIÇÃO</th><th>CLASSIFICAÇÃO</th><th>VALOR TOTAL</th><th>PARC. ATUAL</th><th>QTD PARCELA</th><th>VALOR PARCELA</th><th>RESPONSÁVEL</th></tr>';
        
        records.forEach(r => {
            html += `<tr><td>${r.year}</td><td>${r.month}</td><td>${r.cardName}</td><td>${r.vencimento}</td><td>${r.data}</td><td>${r.descricao}</td><td>${r.classificacao}</td><td>${r.valorTotal}</td><td>${r.parcAtual}</td><td>${r.qtdParcela}</td><td>${r.valorParcela}</td><td>${r.quem}</td></tr>`;
        });
        
        html += '</table>';
        
        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `controle-cartao-${new Date().toISOString().split('T')[0]}.xls`;
        link.click();
        showToast('Exportado para Excel com sucesso', 'success');
    });
}

function exportToPDF() {
    getFilteredRecords({
        year: document.getElementById('filterYear').value,
        month: document.getElementById('filterMonth').value,
        cardId: document.getElementById('filterCard').value,
        classification: document.getElementById('filterClassification').value,
        person: document.getElementById('filterPerson').value
    }).then(records => {
        if (records.length === 0) {
            showToast('Nenhum registro para exportar', 'warning');
            return;
        }
        
        let html = '<h1>Controle de Cartão Anauê</h1>';
        html += `<p>Data de exportação: ${new Date().toLocaleDateString('pt-BR')}</p>`;
        html += '<table border="1" cellpadding="5" cellspacing="0" style="width:100%; font-size:10px;">';
        html += '<tr><th>ANO</th><th>MÊS</th><th>CARTÃO</th><th>DATA</th><th>DESCRIÇÃO</th><th>CLASSIFICAÇÃO</th><th>VALOR</th><th>RESPONSÁVEL</th></tr>';
        
        records.forEach(r => {
            html += `<tr><td>${r.year}</td><td>${r.month}</td><td>${r.cardName}</td><td>${r.data}</td><td>${r.descricao}</td><td>${r.classificacao}</td><td>R$ ${r.valorParcela.toFixed(2)}</td><td>${r.quem}</td></tr>`;
        });
        
        html += '</table>';
        
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        showToast('Abrindo PDF para impressão', 'success');
    });
}

// ============================================
// EVENT LISTENERS - EXPORTACAO E DELECAO
// ============================================

document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
document.getElementById('trashBtn')?.addEventListener('click', () => {
    toggleDeleteMode();
    const deleteBar = document.getElementById('deleteActionBar');
    if (deleteMode) {
        deleteBar.style.display = 'flex';
    } else {
        deleteBar.style.display = 'none';
    }
});

document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
    deleteSelectedRecords().then(() => {
        toggleDeleteMode();
        document.getElementById('deleteActionBar').style.display = 'none';
    });
});

document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
    toggleDeleteMode();
    document.getElementById('deleteActionBar').style.display = 'none';
});

// ============================================
// NAVEGACAO TAB BAR
// ============================================

document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        switchTab(tabName);
    });
});

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        console.log('Banco de dados inicializado');

        // Registrar service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registrado'))
                .catch(err => console.error('Erro ao registrar Service Worker:', err));
        }

        // Carregar dados iniciais
        updateDashboard();
        updatePurchaseForm();
        updateQueryFilters();
        updateCardsList();
        
        // Adicionar listeners de filtros
        document.getElementById('filterYear')?.addEventListener('change', updateQueryRecords);
        document.getElementById('filterMonth')?.addEventListener('change', updateQueryRecords);
        document.getElementById('filterCard')?.addEventListener('change', updateQueryRecords);
        document.getElementById('filterClassification')?.addEventListener('change', updateQueryRecords);
        document.getElementById('filterPerson')?.addEventListener('change', updateQueryRecords);
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            document.getElementById('filterYear').value = '';
            document.getElementById('filterMonth').value = '';
            document.getElementById('filterCard').value = '';
            document.getElementById('filterClassification').value = '';
            document.getElementById('filterPerson').value = '';
            updateQueryRecords();
        });
        
        document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
        document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
        document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
        document.getElementById('trashBtn')?.addEventListener('click', toggleDeleteMode);
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', deleteSelectedRecords);
        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
            deleteMode = false;
            selectedRecordsForDelete.clear();
            document.getElementById('trashBtn').classList.remove('active');
            document.getElementById('recordsList').classList.remove('delete-mode');
            document.getElementById('deleteActionBar').style.display = 'none';
            updateQueryRecords();
        });
    } catch (error) {
        console.error('Erro na inicializacao:', error);
        showToast('Erro ao inicializar aplicacao', 'error');
    }
});
