
/* =========================================================
   YANLINENT 库存管理系统
   完整更新版 app.js

   功能：
   1. Supabase 初始化
   2. 用户注册
   3. 用户登录
   4. 用户登出
   5. 邮箱验证提示
   6. 当前用户资料显示
   7. 页面切换
   8. 手机菜单
   9. 新增货品
   10. 读取货品
   11. 搜索货品
   12. 删除货品
   13. 首页库存统计
========================================================= */


/* =========================================================
   第一部分：Supabase 初始化
========================================================= */

const SUPABASE_URL = "https://jrflocvvcmffzxgifvfh.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_Q0_WcjdpuIPJSI0tN_-lkg_LxRVUSgU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

window.yanlinentSupabase = supabaseClient;

console.log("yanlinent Supabase 初始化成功!");



/* =========================================================
   第二部分：全局变量
========================================================= */

let products = [];

let websiteInitialized = false;
let websiteInitializationPromise = null;

let authListener = null;
let authEventsInitialized = false;
let appEventsInitialized = false;

let currentUser = null;


const pageInformation = {
    dashboard: {
        title: "首页 Dashboard",
        subtitle: "欢迎使用 Yanlinent 库存管理系统"
    },

    products: {
        title: "货品管理",
        subtitle: "管理所有货品资料"
    },

    stockin: {
        title: "进货管理",
        subtitle: "记录货品进货数量"
    },

    stockout: {
        title: "出货管理",
        subtitle: "记录货品出货数量"
    },

    history: {
        title: "交易记录",
        subtitle: "查看所有进出货记录"
    },

    receipt: {
        title: "收据管理",
        subtitle: "管理及打印收据"
    },

    settings: {
        title: "系统设置",
        subtitle: "管理系统资料"
    }
};



/* =========================================================
   第三部分：辅助函数
========================================================= */

// 防止特殊字符影响 HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}


// RM 货币格式
function formatRM(value) {
    return "RM " + Number(value || 0).toFixed(2);
}


// 显示提示
function showMessage(message) {
    alert(message);
}


// 取得用户显示名称
function getUserDisplayName(user) {
    if (!user) {
        return "用户";
    }

    const metadata = user.user_metadata || {};

    return (
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "用户"
    );
}



/* =========================================================
   第四部分：登录及注册画面切换
========================================================= */

function showLoginForm() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const registerLink = document.getElementById("registerLink");

    if (loginForm) {
        loginForm.style.display = "block";
    }

    if (registerForm) {
        registerForm.style.display = "none";
    }

    if (registerLink) {
        registerLink.style.display = "block";
    }

    const loginMessage = document.getElementById("loginMessage");
    const registerMessage = document.getElementById("registerMessage");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    if (registerMessage) {
        registerMessage.textContent = "";
    }
}


function showRegisterForm() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const registerLink = document.getElementById("registerLink");

    if (loginForm) {
        loginForm.style.display = "none";
    }

    if (registerForm) {
        registerForm.style.display = "block";
    }

    if (registerLink) {
        registerLink.style.display = "none";
    }

    const loginMessage = document.getElementById("loginMessage");
    const registerMessage = document.getElementById("registerMessage");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    if (registerMessage) {
        registerMessage.textContent = "";
        registerMessage.style.color = "#dc2626";
    }
}



/* =========================================================
   第五部分：绑定注册及登录画面事件
========================================================= */

function setupAuthEventListeners() {
    if (authEventsInitialized) {
        return;
    }

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const showRegisterButton =
        document.getElementById("showRegisterButton");

    const showLoginButton =
        document.getElementById("showLoginButton");


    if (loginForm) {
        loginForm.addEventListener("submit", loginAdmin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", registerAdmin);
    }

    if (showRegisterButton) {
        showRegisterButton.addEventListener(
            "click",
            showRegisterForm
        );
    }

    if (showLoginButton) {
        showLoginButton.addEventListener(
            "click",
            showLoginForm
        );
    }

    authEventsInitialized = true;

    console.log("登录及注册事件已绑定!");
}



/* =========================================================
   第六部分：注册新账号
========================================================= */

async function registerAdmin(event) {
    event.preventDefault();

    const nameInput = document.getElementById("registerName");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmInput = document.getElementById("confirmPassword");

    const message = document.getElementById("registerMessage");
    const button = document.getElementById("registerButton");

    if (
        !nameInput ||
        !emailInput ||
        !passwordInput ||
        !confirmInput ||
        !button
    ) {
        showMessage("注册表格不完整，请检查 HTML！");
        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;


    if (message) {
        message.textContent = "";
        message.style.color = "#dc2626";
    }


    if (!name || !email || !password || !confirmPassword) {
        if (message) {
            message.textContent = "请填写所有资料！";
        }

        return;
    }


    if (password.length < 6) {
        if (message) {
            message.textContent = "密码至少需要 6 个字符！";
        }

        return;
    }


    if (password !== confirmPassword) {
        if (message) {
            message.textContent = "两次输入的密码不一致！";
        }

        return;
    }


    button.disabled = true;
    button.textContent = "注册中...";


    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,

            options: {
                data: {
                    full_name: name
                }
            }
        });


        if (error) {
            throw error;
        }


        // Supabase 如果没有开启邮箱验证，
        // 注册成功后可能直接建立登录 Session。
        if (data.session) {

            if (message) {
                message.style.color = "green";
                message.textContent = "注册成功，正在进入系统...";
            }

            await enterWebsite();

        } else {

            // 如果开启邮箱验证，用户需要先确认 Email。
            if (message) {
                message.style.color = "green";

                message.textContent =
                    "注册申请成功！请检查你的 Email，完成邮箱验证后，再返回登录页面。";
            }

            const registerForm = document.getElementById("registerForm");

            if (registerForm) {
                registerForm.reset();
            }

        }

    } catch (error) {
        console.error("注册失败：", error);

        if (message) {
            message.style.color = "#dc2626";
            message.textContent = "注册失败：" + error.message;
        }

    } finally {
        button.disabled = false;
        button.textContent = "注册账号";
    }
}



/* =========================================================
   第七部分：登录账号
========================================================= */

async function loginAdmin(event) {
    if (event) {
        event.preventDefault();
    }

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");

    if (!emailInput || !passwordInput || !loginButton) {
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;


    if (loginMessage) {
        loginMessage.textContent = "";
    }


    if (!email || !password) {
        if (loginMessage) {
            loginMessage.textContent = "请输入 Email 和密码！";
        }

        return;
    }


    loginButton.disabled = true;
    loginButton.textContent = "登录中...";


    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("登录失败，请检查账号资料！");
        }

        // 登录成功后进入网站
        await enterWebsite();

    } catch (error) {
        console.error("登录失败：", error);

        if (loginMessage) {
            loginMessage.textContent = "登录失败：" + error.message;
        }

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "登录";
    }
}



/* =========================================================
   第八部分：显示当前用户资料
========================================================= */

function updateUserInformation(user) {
    if (!user) {
        return;
    }

    const name = getUserDisplayName(user);
    const email = user.email || "";
    const firstLetter = name.charAt(0).toUpperCase();

    const welcomeUserName =
        document.getElementById("welcomeUserName");

    const sidebarUserName =
        document.getElementById("sidebarUserName");

    const sidebarUserEmail =
        document.getElementById("sidebarUserEmail");

    const mobileUserName =
        document.getElementById("mobileUserName");

    const userAvatar =
        document.getElementById("userAvatar");

    const topbarAvatar =
        document.getElementById("topbarAvatar");


    if (welcomeUserName) {
        welcomeUserName.textContent = name;
    }

    if (sidebarUserName) {
        sidebarUserName.textContent = name;
    }

    if (sidebarUserEmail) {
        sidebarUserEmail.textContent = email;
    }

    if (mobileUserName) {
        mobileUserName.textContent = name;
    }

    if (userAvatar) {
        userAvatar.textContent = firstLetter;
    }

    if (topbarAvatar) {
        topbarAvatar.textContent = firstLetter;
    }
}



/* =========================================================
   第九部分：登录画面显示
========================================================= */

function showLoginScreen() {
    const authScreen = document.getElementById("authScreen");
    const mainApp = document.getElementById("mainApp");

    if (authScreen) {
        authScreen.style.display = "flex";
    }

    if (mainApp) {
        mainApp.style.display = "none";
    }

    showLoginForm();
}



/* =========================================================
   第十部分：进入系统
========================================================= */

async function enterWebsite() {
    const authScreen = document.getElementById("authScreen");
    const mainApp = document.getElementById("mainApp");

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        showLoginScreen();
        return;
    }

    currentUser = data.user;

    if (authScreen) {
        authScreen.style.display = "none";
    }

    if (mainApp) {
        mainApp.style.display = "block";
    }

    updateUserInformation(currentUser);

    await initializeWebsite();
}



/* =========================================================
   第十一部分：登出账号
========================================================= */

async function logoutAdmin() {
    const confirmed = confirm("确定要退出 yanlinent 系统吗？");

    if (!confirmed) {
        return;
    }

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.disabled = true;
        logoutButton.textContent = "退出中...";
    }

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        products = [];
        currentUser = null;

        websiteInitialized = false;
        websiteInitializationPromise = null;

        showLoginScreen();

    } catch (error) {
        console.error("登出失败：", error);

        showMessage("登出失败：" + error.message);

    } finally {
        if (logoutButton) {
            logoutButton.disabled = false;
            logoutButton.textContent = "登出";
        }
    }
}



/* =========================================================
   第十二部分：页面切换
========================================================= */

function showPage(pageName) {
    const targetPage = document.getElementById(pageName);

    if (!targetPage) {
        console.warn("找不到页面：", pageName);
        return;
    }

    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active");
    });

    targetPage.classList.add("active");


    // 更新页面标题
    const information = pageInformation[pageName];

    if (information) {
        const titleElement = document.getElementById("pageTitle");
        const subtitleElement = document.getElementById("pageSubtitle");

        if (titleElement) {
            titleElement.textContent = information.title;
        }

        if (subtitleElement) {
            subtitleElement.textContent = information.subtitle;
        }
    }


    // 更新菜单选中状态
    document.querySelectorAll(".nav-link").forEach(function (link) {
        link.classList.remove("active");

        if (link.dataset.page === pageName) {
            link.classList.add("active");
        }
    });


    // 根据页面执行对应功能
    if (pageName === "products") {
        loadProducts();
    }

    if (pageName === "dashboard") {
        updateDashboard();
    }


    // 手机打开页面后关闭菜单
    const sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.remove("active");
    }
}



/* =========================================================
   第十三部分：手机菜单
========================================================= */

function toggleMobileMenu() {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) {
        return;
    }

    sidebar.classList.toggle("active");
}



/* =========================================================
   第十四部分：新增货品弹窗
========================================================= */

function addProduct() {
    const modal = document.getElementById("productModal");
    const form = document.getElementById("productForm");
    const message = document.getElementById("productFormMessage");

    if (!modal || !form) {
        showMessage("找不到新增货品表单，请检查 index.html！");
        return;
    }

    form.reset();

    if (message) {
        message.textContent = "";
    }

    modal.style.display = "flex";

    const nameInput = document.getElementById("newProductName");

    if (nameInput) {
        nameInput.focus();
    }
}


function closeProductModal() {
    const modal = document.getElementById("productModal");

    if (modal) {
        modal.style.display = "none";
    }
}



/* =========================================================
   第十五部分：保存货品
========================================================= */

async function saveProduct(event) {
    event.preventDefault();

    const nameInput = document.getElementById("newProductName");
    const priceInput = document.getElementById("newProductPrice");

    const message = document.getElementById("productFormMessage");
    const saveButton = document.getElementById("saveProductButton");

    if (!nameInput || !priceInput || !saveButton) {
        showMessage("找不到货品表单输入框，请检查 HTML！");
        return;
    }

    const name = nameInput.value.trim();
    const price = Number(priceInput.value);


    if (message) {
        message.textContent = "";
    }


    if (!name) {
        if (message) {
            message.textContent = "请输入货品名称！";
        }

        return;
    }


    if (
        priceInput.value.trim() === "" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        if (message) {
            message.textContent = "请输入正确的出售价格！";
        }

        return;
    }


    saveButton.disabled = true;
    saveButton.textContent = "保存中...";


    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("登录状态已失效，请重新登录！");
        }


        // 自动生成货品编号
        const sku = "YL" + Date.now().toString().slice(-8);


        const newProduct = {
            user_id: userData.user.id,
            sku: sku,
            name: name,
            price: price,
            stock: 0
        };


        const { error } = await supabaseClient
            .from("products")
            .insert(newProduct);

        if (error) {
            throw error;
        }


        showMessage("货品新增成功！");

        closeProductModal();

        await loadProducts();

        updateDashboard();

    } catch (error) {
        console.error("新增货品失败：", error);

        if (message) {
            message.textContent = "保存失败：" + error.message;
        }

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "保存货品";
    }
}



/* =========================================================
   第十六部分：读取货品
========================================================= */

async function loadProducts() {
    const productList = document.getElementById("productList");

    if (!productList) {
        return;
    }

    productList.innerHTML = `
        <div style="padding:20px;text-align:center;">
            正在读取货品资料...
        </div>
    `;


    try {
        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        products = data || [];

        renderProducts();

        updateDashboard();

    } catch (error) {
        console.error("读取货品失败：", error);

        productList.innerHTML = `
            <div style="padding:20px;color:#dc2626;">
                读取失败：${escapeHTML(error.message)}
            </div>
        `;
    }
}



/* =========================================================
   第十七部分：显示货品
========================================================= */

function renderProducts() {
    const productList = document.getElementById("productList");

    if (!productList) {
        return;
    }

    const searchInput = document.getElementById("productSearch");

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";


    const filteredProducts = products.filter(function (product) {
        const name = String(product.name || "").toLowerCase();
        const sku = String(product.sku || "").toLowerCase();

        return (
            name.includes(searchText) ||
            sku.includes(searchText)
        );
    });


    if (filteredProducts.length === 0) {
        productList.innerHTML = `
            <div style="
                padding:35px;
                text-align:center;
                color:#64748b;
                grid-column:1/-1;
            ">
                <div style="font-size:40px;margin-bottom:10px;">
                    📦
                </div>

                <p>目前没有找到货品</p>
            </div>
        `;

        return;
    }


    productList.innerHTML = filteredProducts.map(function (product) {

        return `
            <div class="product-card">

                <div class="product-image">
                    📦
                </div>

                <div class="product-info">

                    <h3>${escapeHTML(product.name)}</h3>

                    <p>
                        货品编号：
                        ${escapeHTML(product.sku)}
                    </p>

                    <p>
                        当前库存：
                        <strong>${Number(product.stock || 0)}</strong>
                    </p>

                    <p>
                        出售价格：
                        <strong>${formatRM(product.price)}</strong>
                    </p>

                    <button
                        type="button"
                        class="delete-product-button"
                        data-id="${escapeHTML(product.id)}"
                        style="
                            margin-top:12px;
                            padding:9px 14px;
                            border:0;
                            border-radius:7px;
                            background:#fee2e2;
                            color:#dc2626;
                            cursor:pointer;
                        "
                    >
                        删除货品
                    </button>

                </div>

            </div>
        `;

    }).join("");


    // 删除按钮事件
    productList.querySelectorAll(".delete-product-button")
        .forEach(function (button) {

            button.addEventListener("click", function () {
                deleteProduct(button.dataset.id);
            });

        });
}



/* =========================================================
   第十八部分：搜索货品
========================================================= */

function searchProducts() {
    renderProducts();
}



/* =========================================================
   第十九部分：删除货品
========================================================= */

async function deleteProduct(productId) {
    const product = products.find(function (item) {
        return String(item.id) === String(productId);
    });

    if (!product) {
        showMessage("找不到这件货品！");
        return;
    }


    const confirmed = confirm(
        "确定要删除货品「" + product.name + "」吗？"
    );

    if (!confirmed) {
        return;
    }


    try {
        const { error } = await supabaseClient
            .from("products")
            .delete()
            .eq("id", productId);

        if (error) {
            throw error;
        }

        showMessage("货品删除成功！");

        await loadProducts();

        updateDashboard();

    } catch (error) {
        console.error("删除货品失败：", error);

        showMessage("删除失败：" + error.message);
    }
}



/* =========================================================
   第二十部分：首页统计
========================================================= */

function updateDashboard() {

    const totalProducts = products.length;

    const totalStock = products.reduce(function (total, product) {
        return total + Number(product.stock || 0);
    }, 0);


    const productCountElement =
        document.getElementById("totalProducts");

    const stockCountElement =
        document.getElementById("totalStock");

    const todayStockInElement =
        document.getElementById("todayStockIn");

    const todayStockOutElement =
        document.getElementById("todayStockOut");


    if (productCountElement) {
        productCountElement.textContent = totalProducts;
    }

    if (stockCountElement) {
        stockCountElement.textContent = totalStock;
    }

    // 进货和出货功能尚未接入，先显示零
    if (todayStockInElement) {
        todayStockInElement.textContent = formatRM(0);
    }

    if (todayStockOutElement) {
        todayStockOutElement.textContent = formatRM(0);
    }
}



/* =========================================================
   第二十一部分：绑定网站按钮事件
========================================================= */

function setupEventListeners() {

    if (appEventsInitialized) {
        return;
    }


    // 左侧菜单
    document.querySelectorAll(".nav-link").forEach(function (link) {

        link.addEventListener("click", function (event) {
            event.preventDefault();

            const pageName = link.dataset.page;

            if (pageName) {
                showPage(pageName);
            }
        });

    });


    // 快捷操作按钮
    document.querySelectorAll("[data-go]").forEach(function (button) {

        button.addEventListener("click", function (event) {
            event.preventDefault();

            const pageName = button.dataset.go;

            if (pageName) {
                showPage(pageName);
            }
        });

    });


    // 手机菜单
    const menuButton = document.getElementById("menuButton");

    if (menuButton) {
        menuButton.addEventListener("click", toggleMobileMenu);
    }


    // 新增货品
    const addProductButton =
        document.getElementById("addProductButton");

    if (addProductButton) {
        addProductButton.addEventListener("click", addProduct);
    }


    // 保存货品
    const productForm =
        document.getElementById("productForm");

    if (productForm) {
        productForm.addEventListener("submit", saveProduct);
    }


    // 取消新增货品
    const cancelProductButton =
        document.getElementById("cancelProductButton");

    if (cancelProductButton) {
        cancelProductButton.addEventListener(
            "click",
            closeProductModal
        );
    }


    // 点击弹窗外面关闭
    const productModal =
        document.getElementById("productModal");

    if (productModal) {
        productModal.addEventListener("click", function (event) {

            if (event.target === productModal) {
                closeProductModal();
            }

        });
    }


    // 搜索货品
    const productSearch =
        document.getElementById("productSearch");

    if (productSearch) {
        productSearch.addEventListener("input", searchProducts);
    }


    // 登出按钮
    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", logoutAdmin);
    }


    appEventsInitialized = true;

    console.log("yanlinent 所有网站事件已绑定!");
}



/* =========================================================
   第二十二部分：网站初始化
========================================================= */

async function initializeWebsite() {

    if (websiteInitialized) {
        return;
    }

    if (websiteInitializationPromise) {
        return websiteInitializationPromise;
    }


    websiteInitializationPromise = (async function () {

        console.log("yanlinent 网站初始化中...");

        setupEventListeners();

        await loadProducts();

        showPage("dashboard");

        websiteInitialized = true;

        console.log("yanlinent 网站初始化成功!");

    })();


    try {
        await websiteInitializationPromise;

    } catch (error) {
        websiteInitialized = false;
        throw error;

    } finally {
        websiteInitializationPromise = null;
    }
}



/* =========================================================
   第二十三部分：监听 Supabase 登录状态
========================================================= */

async function startAuthentication() {

    console.log("yanlinent JavaScript 已成功加载!");

    setupAuthEventListeners();

    showLoginScreen();


    // 监听登录、登出及 Session 变化
    const { data: listenerData } =
        supabaseClient.auth.onAuthStateChange(
            function (event, session) {

                console.log("Supabase Auth 状态：", event);


                if (event === "SIGNED_IN" && session) {

                    // 避免在 Supabase Auth 回调中直接执行其他 Auth 请求
                    queueMicrotask(function () {
                        enterWebsite().catch(function (error) {
                            console.error("进入系统失败：", error);
                        });
                    });

                }


                if (event === "SIGNED_OUT") {

                    products = [];
                    currentUser = null;

                    websiteInitialized = false;
                    websiteInitializationPromise = null;

                    showLoginScreen();

                }

            }
        );


    authListener = listenerData.subscription;


    // 检查是否已有登录状态
    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (data.session) {
            await enterWebsite();
        } else {
            showLoginScreen();
        }

    } catch (error) {
        console.error("检查登录状态失败：", error);

        showLoginScreen();
    }

}



/* =========================================================
   第二十四部分：启动网站
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    startAuthentication().catch(function (error) {
        console.error("yanlinent 启动失败：", error);
    });

});
