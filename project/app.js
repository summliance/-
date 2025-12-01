// ========== 数据管理层 ==========
// 使用LocalStorage进行数据持久化存储

class DataManager {
    constructor() {
        this.STORAGE_KEYS = {
            DISHES: 'couple_dishes',
            CATEGORIES: 'couple_categories',
            ORDERS: 'couple_orders',
            FAVORITES: 'couple_favorites'
        };
        this.initializeDefaultData();
    }

    // 初始化默认数据
    initializeDefaultData() {
        if (!this.getCategories().length) {
            this.saveCategories(['家常菜', '川菜', '粤菜', '减脂餐', '快手菜']);
        }
    }

    // 获取数据
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取数据失败:', error);
            return [];
        }
    }

    // 保存数据
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    // 菜品相关操作
    getDishes() {
        return this.getData(this.STORAGE_KEYS.DISHES);
    }

    saveDishes(dishes) {
        return this.saveData(this.STORAGE_KEYS.DISHES, dishes);
    }

    addDish(dish) {
        const dishes = this.getDishes();
        dish.id = Date.now().toString();
        dish.createdAt = new Date().toISOString();
        dishes.push(dish);
        return this.saveDishes(dishes);
    }

    updateDish(dishId, updatedDish) {
        const dishes = this.getDishes();
        const index = dishes.findIndex(d => d.id === dishId);
        if (index !== -1) {
            dishes[index] = { ...dishes[index], ...updatedDish };
            return this.saveDishes(dishes);
        }
        return false;
    }

    deleteDish(dishId) {
        const dishes = this.getDishes().filter(d => d.id !== dishId);
        return this.saveDishes(dishes);
    }

    getDishById(dishId) {
        return this.getDishes().find(d => d.id === dishId);
    }

    // 分类相关操作
    getCategories() {
        return this.getData(this.STORAGE_KEYS.CATEGORIES);
    }

    saveCategories(categories) {
        return this.saveData(this.STORAGE_KEYS.CATEGORIES, categories);
    }

    addCategory(category) {
        const categories = this.getCategories();
        if (!categories.includes(category)) {
            categories.push(category);
            return this.saveCategories(categories);
        }
        return false;
    }

    deleteCategory(category) {
        const categories = this.getCategories().filter(c => c !== category);
        return this.saveCategories(categories);
    }

    // 订单相关操作
    getOrders() {
        return this.getData(this.STORAGE_KEYS.ORDERS);
    }

    saveOrders(orders) {
        return this.saveData(this.STORAGE_KEYS.ORDERS, orders);
    }

    addOrder(order) {
        const orders = this.getOrders();
        order.id = Date.now().toString();
        order.createdAt = new Date().toISOString();
        orders.unshift(order); // 最新的订单放在前面
        return this.saveOrders(orders);
    }

    deleteOrder(orderId) {
        const orders = this.getOrders().filter(o => o.id !== orderId);
        return this.saveOrders(orders);
    }

    // 收藏相关操作
    getFavorites() {
        return this.getData(this.STORAGE_KEYS.FAVORITES);
    }

    saveFavorites(favorites) {
        return this.saveData(this.STORAGE_KEYS.FAVORITES, favorites);
    }

    toggleFavorite(dishId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(dishId);
        if (index === -1) {
            favorites.push(dishId);
        } else {
            favorites.splice(index, 1);
        }
        return this.saveFavorites(favorites);
    }

    isFavorite(dishId) {
        return this.getFavorites().includes(dishId);
    }

    // ========== 数据导出/导入功能 ==========
    // 导出所有数据
    exportData() {
        const data = {
            dishes: this.getDishes(),
            categories: this.getCategories(),
            orders: this.getOrders(),
            favorites: this.getFavorites(),
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
        return data;
    }

    // 导入数据
    importData(data, mode = 'merge') {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('无效的数据格式');
            }

            if (mode === 'replace') {
                // 替换模式：清空后导入
                if (data.dishes) this.saveDishes(data.dishes);
                if (data.categories) this.saveCategories(data.categories);
                if (data.orders) this.saveOrders(data.orders);
                if (data.favorites) this.saveFavorites(data.favorites);
            } else {
                // 合并模式：保留现有数据
                if (data.dishes) {
                    const existingDishes = this.getDishes();
                    const existingIds = new Set(existingDishes.map(d => d.id));
                    const newDishes = data.dishes.filter(d => !existingIds.has(d.id));
                    this.saveDishes([...existingDishes, ...newDishes]);
                }
                
                if (data.categories) {
                    const existingCategories = this.getCategories();
                    const mergedCategories = [...new Set([...existingCategories, ...data.categories])];
                    this.saveCategories(mergedCategories);
                }
                
                if (data.orders) {
                    const existingOrders = this.getOrders();
                    const existingIds = new Set(existingOrders.map(o => o.id));
                    const newOrders = data.orders.filter(o => !existingIds.has(o.id));
                    this.saveOrders([...existingOrders, ...newOrders]);
                }
                
                if (data.favorites) {
                    const existingFavorites = this.getFavorites();
                    const mergedFavorites = [...new Set([...existingFavorites, ...data.favorites])];
                    this.saveFavorites(mergedFavorites);
                }
            }

            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    // 清空所有数据
    clearAllData() {
        localStorage.removeItem(this.STORAGE_KEYS.DISHES);
        localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
        localStorage.removeItem(this.STORAGE_KEYS.ORDERS);
        localStorage.removeItem(this.STORAGE_KEYS.FAVORITES);
        this.initializeDefaultData();
    }
}

// ========== 应用主控制器 ==========
class CoupleMenuApp {
    constructor() {
        this.dataManager = new DataManager();
        this.currentView = 'dishes';
        this.currentCategory = 'all';
        this.currentOrder = [];
        this.editingDishId = null;
        this.currentStatsPeriod = 'week';
        
        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.switchView('dishes');
        this.renderCategories();
    }

    // 绑定事件监听器
    bindEvents() {
        // Tab导航切换
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // 添加菜品按钮
        document.getElementById('addDishBtn').addEventListener('click', () => {
            this.openDishModal();
        });

        // 关闭菜品模态框
        document.getElementById('closeDishModal').addEventListener('click', () => {
            this.closeDishModal();
        });

        document.getElementById('cancelDishBtn').addEventListener('click', () => {
            this.closeDishModal();
        });

        // 菜品表单提交
        document.getElementById('dishForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDish();
        });

        // 图片预览（已移除）
        // document.getElementById('dishImage').addEventListener('input', (e) => {
        //     this.previewImage(e.target.value);
        // });

        // 分类管理
        document.getElementById('manageCategoriesBtn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        document.getElementById('closeCategoryModal').addEventListener('click', () => {
            this.closeCategoryModal();
        });

        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.addCategory();
        });

        // 搜索
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.openSearchModal();
        });

        document.getElementById('closeSearchModal').addEventListener('click', () => {
            this.closeSearchModal();
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        // 分享
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.openShareModal();
        });

        document.getElementById('closeShareModal').addEventListener('click', () => {
            this.closeShareModal();
        });

        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyShareLink();
        });

        // 数据管理
        document.getElementById('dataManageBtn').addEventListener('click', () => {
            this.openDataManageModal();
        });

        document.getElementById('closeDataManageModal').addEventListener('click', () => {
            this.closeDataManageModal();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importMergeBtn').addEventListener('click', () => {
            this.importData('merge');
        });

        document.getElementById('importReplaceBtn').addEventListener('click', () => {
            this.importData('replace');
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // 关闭菜品详情
        document.getElementById('closeDishDetail').addEventListener('click', () => {
            this.closeDishDetail();
        });

        // 提交订单
        document.getElementById('submitOrderBtn').addEventListener('click', () => {
            this.submitOrder();
        });

        // 历史订单筛选
        document.getElementById('filterDate').addEventListener('change', () => {
            this.renderHistory();
        });

        document.getElementById('filterDishName').addEventListener('input', () => {
            this.renderHistory();
        });

        // 统计周期切换
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentStatsPeriod = e.target.dataset.period;
                this.renderStats();
            });
        });

        // 分类筛选
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tag')) {
                document.querySelectorAll('.category-tag').forEach(tag => {
                    tag.classList.remove('active');
                });
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderDishes();
            }
        });
    }

    // 视图切换
    switchView(viewName) {
        // 更新Tab激活状态
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === viewName) {
                tab.classList.add('active');
            }
        });

        // 更新视图显示
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');

        this.currentView = viewName;

        // 渲染对应视图的内容
        switch (viewName) {
            case 'dishes':
                this.renderDishes();
                break;
            case 'history':
                this.renderHistory();
                break;
            case 'stats':
                this.renderStats();
                break;
            case 'favorites':
                this.renderFavorites();
                break;
        }
    }

    // ========== 分类管理 ==========
    renderCategories() {
        const categories = this.dataManager.getCategories();
        const categoryList = document.getElementById('categoryList');
        
        categoryList.innerHTML = categories.map(cat => 
            `<button class="category-tag" data-category="${cat}">${cat}</button>`
        ).join('');
    }

    openCategoryModal() {
        document.getElementById('categoryModal').classList.add('active');
        this.renderCategoryManageList();
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        document.getElementById('newCategoryName').value = '';
    }

    renderCategoryManageList() {
        const categories = this.dataManager.getCategories();
        const list = document.getElementById('categoryManageList');
        
        list.innerHTML = categories.map(cat => `
            <div class="category-manage-item">
                <span>${cat}</span>
                <button onclick="app.deleteCategory('${cat}')">删除</button>
            </div>
        `).join('');
    }

    addCategory() {
        const input = document.getElementById('newCategoryName');
        const categoryName = input.value.trim();
        
        if (categoryName) {
            if (this.dataManager.addCategory(categoryName)) {
                input.value = '';
                this.renderCategories();
                this.renderCategoryManageList();
                this.renderDishCategoriesInForm();
            } else {
                alert('该分类已存在！');
            }
        }
    }

    deleteCategory(categoryName) {
        if (confirm(`确定要删除分类"${categoryName}"吗？`)) {
            this.dataManager.deleteCategory(categoryName);
            this.renderCategories();
            this.renderCategoryManageList();
        }
    }

    // ========== 菜品管理 ==========
    renderDishes() {
        const dishes = this.dataManager.getDishes();
        const filteredDishes = this.currentCategory === 'all' 
            ? dishes 
            : dishes.filter(dish => dish.categories && dish.categories.includes(this.currentCategory));
        
        const grid = document.getElementById('dishGrid');
        
        if (filteredDishes.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <div class="empty-state-text">还没有菜品，快去添加吧！</div>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = filteredDishes.map(dish => this.createDishCard(dish)).join('');
        
        // 绑定事件
        grid.querySelectorAll('.dish-card').forEach(card => {
            const dishId = card.dataset.dishId;
            
            // 卡片点击事件
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.toggleDishInOrder(dishId);
                }
            });
            
            // 按钮事件
            card.querySelectorAll('button').forEach(btn => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    switch(action) {
                        case 'favorite':
                            this.toggleFavorite(id);
                            break;
                        case 'view':
                            this.viewDishDetail(id);
                            break;
                        case 'edit':
                            this.editDish(id);
                            break;
                        case 'delete':
                            this.deleteDish(id);
                            break;
                    }
                });
            });
        });
    }

    createDishCard(dish) {
        const isFavorite = this.dataManager.isFavorite(dish.id);
        const isInOrder = this.currentOrder.includes(dish.id);
        
        return `
            <div class="dish-card ${isInOrder ? 'selected' : ''}" data-dish-id="${dish.id}">
                <div class="dish-content">
                    <div class="dish-header">
                        <h3 class="dish-name">${dish.name}</h3>
                        <button class="dish-favorite" data-action="favorite" data-id="${dish.id}">${isFavorite ? '❤️' : '🤍'}</button>
                    </div>
                    ${dish.categories ? `
                        <div class="dish-categories">
                            ${dish.categories.map(cat => `<span class="dish-category-tag">${cat}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${dish.ingredients ? `<div class="dish-ingredients">🥘 ${dish.ingredients}</div>` : ''}
                    <div class="dish-actions">
                        <button class="btn-edit" data-action="view" data-id="${dish.id}">查看</button>
                        <button class="btn-edit" data-action="edit" data-id="${dish.id}">编辑</button>
                        <button class="btn-delete" data-action="delete" data-id="${dish.id}">删除</button>
                    </div>
                </div>
            </div>
        `;
    }

    openDishModal(dishId = null) {
        this.editingDishId = dishId;
        const modal = document.getElementById('dishModal');
        const title = document.getElementById('dishModalTitle');
        
        if (dishId) {
            title.textContent = '编辑菜品';
            const dish = this.dataManager.getDishById(dishId);
            this.fillDishForm(dish);
        } else {
            title.textContent = '添加菜品';
            document.getElementById('dishForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
        }
        
        this.renderDishCategoriesInForm();
        modal.classList.add('active');
    }

    closeDishModal() {
        document.getElementById('dishModal').classList.remove('active');
        this.editingDishId = null;
    }

    renderDishCategoriesInForm() {
        const categories = this.dataManager.getCategories();
        const container = document.getElementById('dishCategories');
        
        container.innerHTML = categories.map(cat => `
            <label class="checkbox-label">
                <input type="checkbox" name="category" value="${cat}">
                ${cat}
            </label>
        `).join('');
    }

    fillDishForm(dish) {
        document.getElementById('dishName').value = dish.name || '';
        document.getElementById('dishIngredients').value = dish.ingredients || '';
        document.getElementById('dishInstructions').value = dish.instructions || '';
        
        // 延迟设置分类选中状态，确保复选框已渲染
        setTimeout(() => {
            if (dish.categories) {
                document.querySelectorAll('#dishCategories input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = dish.categories.includes(checkbox.value);
                });
            }
        }, 0);
    }

    saveDish() {
        const name = document.getElementById('dishName').value.trim();
        const ingredients = document.getElementById('dishIngredients').value.trim();
        const instructions = document.getElementById('dishInstructions').value.trim();
        
        const selectedCategories = Array.from(
            document.querySelectorAll('#dishCategories input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        if (!name) {
            alert('请输入菜品名称！');
            return;
        }
        
        if (selectedCategories.length === 0) {
            alert('请至少选择一个分类！');
            return;
        }
        
        const dishData = {
            name,
            categories: selectedCategories,
            ingredients,
            instructions
        };
        
        if (this.editingDishId) {
            this.dataManager.updateDish(this.editingDishId, dishData);
        } else {
            this.dataManager.addDish(dishData);
        }
        
        this.closeDishModal();
        this.renderDishes();
        this.renderCategories();
        this.updateOrderPanel();
    }

    editDish(dishId) {
        this.openDishModal(dishId);
    }

    deleteDish(dishId) {
        if (confirm('确定要删除这道菜吗？')) {
            this.dataManager.deleteDish(dishId);
            this.renderDishes();
        }
    }

    viewDishDetail(dishId) {
        const dish = this.dataManager.getDishById(dishId);
        if (!dish) return;
        
        const modal = document.getElementById('dishDetailModal');
        const title = document.getElementById('detailDishName');
        const content = document.getElementById('dishDetailContent');
        
        title.textContent = dish.name;
        
        content.innerHTML = `
            ${dish.categories ? `
                <div style="margin-bottom:var(--spacing-md)">
                    <strong style="color:var(--primary-color)">分类：</strong>
                    ${dish.categories.map(cat => `<span class="dish-category-tag">${cat}</span>`).join(' ')}
                </div>
            ` : ''}
            
            ${dish.ingredients ? `
                <div style="margin-bottom:var(--spacing-md)">
                    <strong style="color:var(--primary-color)">食材：</strong>
                    <p style="margin-top:var(--spacing-xs)">${dish.ingredients}</p>
                </div>
            ` : ''}
            
            ${dish.instructions ? `
                <div>
                    <strong style="color:var(--primary-color)">做法：</strong>
                    <p style="margin-top:var(--spacing-xs);white-space:pre-wrap;">${dish.instructions}</p>
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
    }

    closeDishDetail() {
        document.getElementById('dishDetailModal').classList.remove('active');
    }

    toggleFavorite(dishId) {
        this.dataManager.toggleFavorite(dishId);
        // 重新渲染当前视图
        if (this.currentView === 'dishes') {
            this.renderDishes();
        } else if (this.currentView === 'favorites') {
            this.renderFavorites();
        }
        this.updateOrderPanel();
    }

    // ========== 点菜功能 ==========
    toggleDishInOrder(dishId) {
        const index = this.currentOrder.indexOf(dishId);
        if (index === -1) {
            this.currentOrder.push(dishId);
        } else {
            this.currentOrder.splice(index, 1);
        }
        this.renderDishes();
        this.updateOrderPanel();
    }

    updateOrderPanel() {
        const panel = document.getElementById('orderFloatPanel');
        const orderList = document.getElementById('orderList');
        const orderCount = document.getElementById('orderCount');
        
        orderCount.textContent = this.currentOrder.length;
        
        if (this.currentOrder.length === 0) {
            panel.classList.remove('show');
            return;
        }
        
        panel.classList.add('show');
        
        orderList.innerHTML = this.currentOrder.map(dishId => {
            const dish = this.dataManager.getDishById(dishId);
            return `
                <div class="order-item">
                    <span class="order-item-name">${dish.name}</span>
                    <button class="order-item-remove" onclick="app.toggleDishInOrder('${dishId}')">×</button>
                </div>
            `;
        }).join('');
    }

    submitOrder() {
        if (this.currentOrder.length === 0) {
            alert('请先选择菜品！');
            return;
        }
        
        const orderDishes = this.currentOrder.map(dishId => {
            const dish = this.dataManager.getDishById(dishId);
            return {
                id: dish.id,
                name: dish.name
            };
        });
        
        this.dataManager.addOrder({
            dishes: orderDishes
        });
        
        alert(`订单提交成功！共选择了 ${this.currentOrder.length} 道菜`);
        this.currentOrder = [];
        this.renderDishes();
        this.updateOrderPanel();
    }

    // ========== 历史订单 ==========
    renderHistory() {
        const orders = this.dataManager.getOrders();
        const filterDate = document.getElementById('filterDate').value;
        const filterDishName = document.getElementById('filterDishName').value.trim().toLowerCase();
        
        let filteredOrders = orders;
        
        // 按日期筛选
        if (filterDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate === filterDate;
            });
        }
        
        // 按菜品名称筛选
        if (filterDishName) {
            filteredOrders = filteredOrders.filter(order => {
                return order.dishes.some(dish => 
                    dish.name.toLowerCase().includes(filterDishName)
                );
            });
        }
        
        const historyList = document.getElementById('historyList');
        
        if (filteredOrders.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <div class="empty-state-text">暂无订单记录</div>
                </div>
            `;
            return;
        }
        
        // 按日期分组订单
        const ordersByDate = {};
        filteredOrders.forEach(order => {
            const date = new Date(order.createdAt);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            if (!ordersByDate[dateKey]) {
                ordersByDate[dateKey] = [];
            }
            ordersByDate[dateKey].push(order);
        });
        
        // 渲染分组后的订单
        historyList.innerHTML = Object.keys(ordersByDate)
            .sort((a, b) => new Date(b) - new Date(a)) // 按日期降序
            .map(dateKey => {
                const dayOrders = ordersByDate[dateKey];
                const [year, month, day] = dateKey.split('-');
                const date = new Date(year, month - 1, day);
                const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
                
                // 统计当天所有菜品
                const allDishes = [];
                dayOrders.forEach(order => {
                    order.dishes.forEach(dish => {
                        const existing = allDishes.find(d => d.name === dish.name);
                        if (existing) {
                            existing.count++;
                        } else {
                            allDishes.push({ ...dish, count: 1, orderId: order.id });
                        }
                    });
                });
                
                return `
                    <div class="history-card">
                        <div class="history-header">
                            <div class="history-date">${month}月${day}日 ${weekDay}</div>
                            <div style="display:flex;align-items:center;gap:var(--spacing-md);">
                                <span>${dayOrders.length} 次订单 / 共 ${allDishes.reduce((sum, d) => sum + d.count, 0)} 道菜</span>
                            </div>
                        </div>
                        <div class="history-dishes">
                            ${allDishes.map(dish => {
                                const tag = dish.count > 1 
                                    ? `<span class="history-dish-tag">${dish.name} ×${dish.count}</span>`
                                    : `<span class="history-dish-tag">${dish.name}</span>`;
                                return tag;
                            }).join('')}
                        </div>
                        <div class="history-orders">
                            ${dayOrders.map(order => {
                                const time = new Date(order.createdAt);
                                const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
                                return `
                                    <div class="history-order-item">
                                        <span class="order-time">${timeStr}</span>
                                        <span class="order-dishes-preview">${order.dishes.map(d => d.name).join('、')}</span>
                                        <button class="history-delete-btn" data-order-id="${order.id}">删除</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        
        // 绑定删除按钮事件
        historyList.querySelectorAll('.history-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.orderId;
                this.deleteOrder(orderId);
            });
        });
    }

    // 删除订单
    deleteOrder(orderId) {
        if (confirm('确定要删除这条订单吗？')) {
            this.dataManager.deleteOrder(orderId);
            this.renderHistory();
            // 如果当前在统计页面，也需要更新
            if (this.currentView === 'stats') {
                this.renderStats();
            }
        }
    }

    // ========== 统计功能 ==========
    renderStats() {
        const orders = this.dataManager.getOrders();
        const period = this.currentStatsPeriod;
        
        // 计算时间范围
        const now = new Date();
        let startDate = new Date();
        let filteredOrders;
        
        // 如果是"总"统计，不筛选时间
        if (period === 'all') {
            filteredOrders = orders;
        } else {
            switch (period) {
                case 'day':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setDate(now.getDate() - 30);
                    break;
            }
            
            // 筛选时间范围内的订单
            filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= startDate;
            });
        }
        
        // 统计每道菜的点单次数
        const dishStats = {};
        filteredOrders.forEach(order => {
            order.dishes.forEach(dish => {
                if (dishStats[dish.id]) {
                    dishStats[dish.id].count++;
                } else {
                    dishStats[dish.id] = {
                        name: dish.name,
                        count: 1
                    };
                }
            });
        });
        
        // 转换为数组并排序
        const statsArray = Object.values(dishStats).sort((a, b) => b.count - a.count);
        
        // 渲染统计列表
        const statsList = document.getElementById('statsList');
        
        if (statsArray.length === 0) {
            statsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">该时间段内暂无数据</div>
                </div>
            `;
            this.renderChart([]);
            return;
        }
        
        statsList.innerHTML = statsArray.map((stat, index) => `
            <div class="stats-item">
                <div class="stats-item-info">
                    <div class="stats-item-name">${index + 1}. ${stat.name}</div>
                </div>
                <div>
                    <div class="stats-item-count">${stat.count}</div>
                    <div class="stats-item-label">次</div>
                </div>
            </div>
        `).join('');
        
        // 渲染图表
        this.renderChart(statsArray.slice(0, 10)); // 只显示前10名
    }

    // 绘制简易柱状图（原生Canvas实现）
    renderChart(data) {
        const canvas = document.getElementById('statsChart');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        const container = canvas.parentElement;
        canvas.width = container.clientWidth - 48; // 减去padding
        canvas.height = 300;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (data.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // 图表配置
        const padding = { top: 20, right: 20, bottom: 60, left: 40 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        // 计算最大值
        const maxCount = Math.max(...data.map(d => d.count));
        
        // 柱状图配置
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;
        
        // 绘制柱状图
        data.forEach((item, index) => {
            const barHeight = (item.count / maxCount) * chartHeight;
            const x = padding.left + index * (barWidth + barSpacing);
            const y = padding.top + chartHeight - barHeight;
            
            // 绘制柱子（渐变色）
            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, '#ff6b9d');
            gradient.addColorStop(1, '#ffc1e3');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 绘制数值
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.count, x + barWidth / 2, y - 5);
            
            // 绘制菜品名称
            ctx.save();
            ctx.translate(x + barWidth / 2, canvas.height - padding.bottom + 10);
            ctx.rotate(-Math.PI / 4);
            ctx.fillStyle = '#666';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name, 0, 0);
            ctx.restore();
        });
        
        // 绘制Y轴
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.stroke();
    }

    // ========== 收藏功能 ==========
    renderFavorites() {
        const favorites = this.dataManager.getFavorites();
        const grid = document.getElementById('favoritesGrid');
        
        if (favorites.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⭐</div>
                    <div class="empty-state-text">还没有收藏的菜品</div>
                </div>
            `;
            return;
        }
        
        const favoriteDishes = favorites.map(id => this.dataManager.getDishById(id)).filter(d => d);
        grid.innerHTML = favoriteDishes.map(dish => this.createDishCard(dish)).join('');
    }

    // ========== 搜索功能 ==========
    openSearchModal() {
        document.getElementById('searchModal').classList.add('active');
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
        setTimeout(() => {
            document.getElementById('searchInput').focus();
        }, 100);
    }

    closeSearchModal() {
        document.getElementById('searchModal').classList.remove('active');
    }

    performSearch(query) {
        const results = document.getElementById('searchResults');
        
        if (!query.trim()) {
            results.innerHTML = '';
            return;
        }
        
        const dishes = this.dataManager.getDishes();
        const searchQuery = query.toLowerCase();
        
        // 搜索菜品名称、食材、分类
        const filteredDishes = dishes.filter(dish => {
            return dish.name.toLowerCase().includes(searchQuery) ||
                   (dish.ingredients && dish.ingredients.toLowerCase().includes(searchQuery)) ||
                   (dish.categories && dish.categories.some(cat => cat.toLowerCase().includes(searchQuery)));
        });
        
        if (filteredDishes.length === 0) {
            results.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">没有找到相关菜品</div>
                </div>
            `;
            return;
        }
        
        results.innerHTML = filteredDishes.map(dish => this.createDishCard(dish)).join('');
    }

    // ========== 数据管理功能 ==========
    openDataManageModal() {
        document.getElementById('dataManageModal').classList.add('active');
    }

    closeDataManageModal() {
        document.getElementById('dataManageModal').classList.remove('active');
    }

    // 导出数据
    exportData() {
        const data = this.dataManager.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        const date = new Date();
        const fileName = `情侣点菜数据_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.json`;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('数据导出成功！');
    }

    // 导入数据
    importData(mode) {
        const input = document.getElementById('importFileInput');
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (mode === 'replace') {
                        if (!confirm('替换导入将清空所有现有数据，确定继续吗？')) {
                            return;
                        }
                    }
                    
                    if (this.dataManager.importData(data, mode)) {
                        alert('数据导入成功！页面将刷新...');
                        location.reload();
                    } else {
                        alert('数据导入失败，请检查文件格式！');
                    }
                } catch (error) {
                    alert('文件格式错误，请选择正确的JSON文件！');
                    console.error(error);
                }
            };
            reader.readAsText(file);
            input.value = ''; // 清空输入以便再次选择同一文件
        };
        
        input.click();
    }

    // 清空所有数据
    clearAllData() {
        if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            return;
        }
        
        if (!confirm('再次确认：真的要删除所有菜品、订单、收藏数据吗？')) {
            return;
        }
        
        this.dataManager.clearAllData();
        alert('数据已清空！页面将刷新...');
        location.reload();
    }

    // ========== 分享功能 ==========
    openShareModal() {
        if (this.currentOrder.length === 0) {
            alert('请先选择要分享的菜品！');
            return;
        }
        
        const modal = document.getElementById('shareModal');
        const orderList = document.getElementById('shareOrderList');
        
        // 生成分享链接（使用URL参数传递订单信息）
        const dishIds = this.currentOrder.join(',');
        const shareUrl = `${window.location.origin}${window.location.pathname}?order=${dishIds}`;
        document.getElementById('shareLink').value = shareUrl;
        
        // 显示要分享的菜品
        const orderDishes = this.currentOrder.map(dishId => {
            const dish = this.dataManager.getDishById(dishId);
            return dish.name;
        });
        
        orderList.innerHTML = `
            <div style="margin-top:var(--spacing-lg);padding:var(--spacing-md);background:var(--bg-color);border-radius:var(--radius-md);">
                <strong>要分享的菜品：</strong>
                <div style="margin-top:var(--spacing-sm);">
                    ${orderDishes.map(name => `<span class="history-dish-tag">${name}</span>`).join(' ')}
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    closeShareModal() {
        document.getElementById('shareModal').classList.remove('active');
    }

    copyShareLink() {
        const input = document.getElementById('shareLink');
        input.select();
        
        try {
            document.execCommand('copy');
            alert('链接已复制到剪贴板！');
        } catch (err) {
            alert('复制失败，请手动复制链接');
        }
    }

    // ========== 处理分享链接 ==========
    handleSharedOrder() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderParam = urlParams.get('order');
        
        if (orderParam) {
            const dishIds = orderParam.split(',');
            const validDishIds = dishIds.filter(id => this.dataManager.getDishById(id));
            
            if (validDishIds.length > 0) {
                this.currentOrder = validDishIds;
                // 切换到点菜视图
                this.switchView('order');
                
                // 清除URL参数
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
}

// ========== 初始化应用 ==========
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CoupleMenuApp();
    // 处理分享链接
    app.handleSharedOrder();
});
