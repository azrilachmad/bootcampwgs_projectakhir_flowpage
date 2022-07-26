// Node Modules
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const { pool } = require("./dbCon");
const bcrypt = require("bcrypt");
const path = require("path");
const moment = require("moment");

const fs = require("fs");

const app = express();
const port = 3000;

// Static File
// User Static File (Build in middleware)
app.use(express.static("public"));

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/products");
  },
  filename: function (req, file, cb) {
    console.log(file);
    cb(null, `item_image-${Date.now()}` + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

const initializePassport = require("./passportCon");

initializePassport(passport);

// user express-ejs=layouts
const expressLayouts = require("express-ejs-layouts");
app.use(expressLayouts);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(flash());

// Index (Home) Page
app.get("/", checkAuthenticated, (req, res) => {
  res.render("loginPage", {
    title: "Login Page",
    layout: "layouts/login-layout",
  });
});

// Page Log
app.get("/log-app", checkNotAuthenticated, isUser, (req, res) => {
  const sql = `SELECT * FROM log_app ORDER BY created_at`;
  pool.query(sql, [], (err, results) => {
    if (err) {
      return console.error(err.message);
    }
    pool.query(
      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Login Page')`
    );
    res.render("log-page", {
      title: "Log List",
      layout: "layouts/main-layout",
      msg: req.flash("msg"),
      model: results.rows,
      username: req.user.username,
      userRole: req.user.role,
    });
  });
});

// User Session
app.get("/admin/dashboard", checkNotAuthenticated, isUser, (req, res) => {
  pool.query(
    `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Dashboard Page')`
  );
  res.render("dashboard", {
    title: "Dashboard",
    layout: "layouts/main-layout",
    username: req.user.username,
    userRole: req.user.role,
  });
});

// Page Item List
app.get("/admin/item-list", checkNotAuthenticated, isUser, (req, res) => {
  const sql = `SELECT * FROM items ORDER BY id`;
  pool.query(sql, [], (err, results) => {
    if (err) {
      return console.error(err.message);
    }
    pool.query(
      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Product Page')`
    );
    res.render("item-list", {
      title: "Item List",
      layout: "layouts/main-layout",
      msg: req.flash("msg"),
      model: results.rows,
      username: req.user.username,
      userRole: req.user.role,
    });
  });
});

// Add Item Page
app.get("/admin/item-list/add", checkNotAuthenticated, isAdmin, (req, res) => {
  pool.query(
    `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Add Product Page')`
  );
  const sql = `SELECT * FROM product_category ORDER BY category`;
  pool.query(sql, (err, results) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("add-item", {
      title: "add Item",
      layout: "layouts/main-layout",
      model: results.rows,
      msg: req.flash("msg"),
      username: req.user.username,
      userRole: req.user.role,
    });
  });
});

// Add Item Category Page
app.get(
  "/item-list/add-category",
  checkNotAuthenticated,
  isAdmin,
  (req, res) => {
    pool.query(
      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Add Product Page')`
    );
    res.render("add-category", {
      title: "Add Product",
      layout: "layouts/main-layout",
    });
  }
);

// Page Item Detail
app.get(
  "/admin/item-list/:item_name",
  checkNotAuthenticated,
  isUser,
  (req, res) => {
    pool.query(
      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Detail Product Page')`
    );
    const sql = `SELECT * FROM items where item_name = '${req.params.item_name}'`;
    pool.query(sql, (err, results) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("item-detail", {
        title: "Item Detail",
        layout: "layouts/main-layout",
        model: results.rows[0],
        msg: req.flash("msg"),
        username: req.user.username,
        userRole: req.user.role,
      });
    });
  }
);

// User list page
app.get("/admin/user-list", checkNotAuthenticated, isAdmin, (req, res) => {
  const sql = `SELECT * FROM users ORDER BY username`;
  pool.query(sql, [], (err, results) => {
    pool.query(
      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access User List Page')`
    );
    if (err) {
      return console.error(err.message);
    }
    res.render("user-list", {
      title: "User List",
      layout: "layouts/main-layout",
      msg: req.flash("msg"),
      model: results.rows,
    });
  });
});

// Page User Detail
app.get(
  "/admin/user-list/:username",
  checkNotAuthenticated,
  isAdmin,
  (req, res) => {
    pool.query(
      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access User Detail Page')`
    );
    const sql = `SELECT * FROM users where username = '${req.params.username}'`;
    pool.query(sql, (err, results) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("user-detail", {
        title: "User Detail",
        layout: "layouts/main-layout",
        model: results.rows[0],
      });
    });
  }
);

// Add User
app.get("/admin/addUser", checkNotAuthenticated, isAdmin, (req, res) => {
  pool.query(
    `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Add User Page')`
  );
  res.render("addUser", {
    title: "Add User",
    layout: "layouts/main-layout",
  });
});

app.get("/logout", checkNotAuthenticated, (req, res, next) => {
  pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [req.user.username],
    (err, results) => {
      if (err) {
        throw err;
      }
      pool.query(
        `INSERT INTO public.log_app(id_user, username, activity) VALUES (${results.rows[0].id}, '${results.rows[0].username}' ,'User Logout')`,
        (err, results) => {
          if (err) {
            throw err;
          }
        }
      );
      req.logout(function (err) {
        if (err) {
          return next(err);
        }
        req.flash("success", `Success logged out`);
        res.redirect("/");
      });
    }
  );
});

app.post(
  "/admin/login",
  passport.authenticate("local", {
    successRedirect: "/admin/dashboard",
    failureRedirect: "/",
    failureFlash: true,
    successFlash: true,
  })
);

app.post("/admin/addUser", checkNotAuthenticated, isAdmin, async (req, res) => {
  const { username, password, role, password2 } = req.body;

  console.log({
    username,
    password,
    role,
  });

  const errors = [];

  if (password.length < 6) {
    errors.push({ message: "Password must be at least 6 characters" });
  }
  if (password !== password2) {
    errors.push({ message: "Password does not match" });
  }
  if (role === undefined) {
    errors.push({ message: "Please select a role" });
  }

  if (errors.length > 0) {
    res.render("addUser", {
      errors,
      layout: "layouts/main-layout",
      title: "Add User",
      params: req.body,
      model: results.rows,
    });
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username],
      (err, results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          errors.push({ message: "Username already exits" });
          res.render("AddUser", {
            errors,
            layout: "layouts/main-layout",
            title: "Add User",
            params: req.body,
          });
        } else {
          const name = username.toLowerCase();
          pool.query(
            `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, password`,
            [name, hashedPassword, role],
            (err, result) => {
              if (err) {
              }
              console.log(result.rows);
              pool.query(
                `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Create New User')`
              );
              req.flash("success", "Successfully created a new user");
              res.redirect("/admin/dashboard");
            }
          );
        }
      }
    );
  }
});

// Add Product Data
app.post(
  "/admin/item-list/add",
  checkNotAuthenticated,
  isAdmin,
  upload.array("img", 1),
  async (req, res) => {
    let img;
    if (!req.files.find((e) => e.filename)) {
      img = "default.jpg";
    } else {
      img = req.files[0].filename;
    }
    const item_name = req.body.item_name;
    const category = req.body.category;
    const price = req.body.price;
    const quantity = req.body.quantity;
    console.log({
      item_name,
      category,
      price,
      quantity,
      img,
    });

    const errors = [];

    if (img === undefined) {
      errors.push({ message: "Please insert an image" });
    }
    if (category === undefined) {
      errors.push({ message: "Please select a category" });
    }

    if (quantity < 0 || quantity === "") {
      errors.push({ message: "Invalid amount of quantity" });
    }

    if (price < 0 || quantity === "") {
      errors.push({ message: "Invalid amount of price" });
    }

    if (errors.length > 0) {
      res.render("add-item", {
        errors,
        layout: "layouts/main-layout",
        title: "Add Item",
        params: req.body,
      });
    } else {
      pool.query(
        `SELECT * FROM items WHERE item_name = $1`,
        [item_name.toLowerCase()],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log(results.rows);

          if (results.rows.length > 0) {
            errors.push({ message: "Product name already exists" });
            res.render("add-item", {
              errors,
              layout: "layouts/main-layout",
              title: "Add Item",
              params: req.body,
            });
          } else {
            const product = item_name.toLowerCase();
            pool.query(
              "INSERT INTO items (item_name, category, price, quantity, item_image) VALUES ($1, $2, $3, $4, $5) RETURNING id",
              [product, category, price, quantity, img],
              (err, results) => {
                if (err) {
                  throw err;
                }
                pool.query(
                  "INSERT INTO product_history (date , product_name, details, quantity, category) VALUES (NOW(), $1, $2, $3, $4) RETURNING id",
                  [product, "Add Product", quantity, category],
                  (err, result) => {
                    if (err) {
                      throw err;
                    }
                    console.log(results.rows);
                    pool.query(
                      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Add New Product')`
                    );
                    req.flash("success", "Successfully create a product");
                    res.redirect("/admin/item-list");
                  }
                );
              }
            );
          }
        }
      );
    }
  }
);

// Add Product Category
app.post(
  "/item-list/add-category",
  checkNotAuthenticated,
  isAdmin,
  upload.array("img", 1),
  async (req, res) => {
    const category = req.body.category;
    console.log({
      category,
    });

    const errors = [];

    if (category === undefined) {
      errors.push({ message: "Please select a category" });
    }

    if (errors.length > 0) {
      res.render("add-category", {
        errors,
        layout: "layouts/main-layout",
        title: "Add Category",
        params: req.body.category,
      });
    } else {
      pool.query(
        `SELECT * FROM items WHERE item_name = $1`,
        [category.toLowerCase()],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log(results.rows);

          if (results.rows.length > 0) {
            errors.push({ message: "ProduCategoryct name already exists" });
            res.render("add-category", {
              errors,
              layout: "layouts/main-layout",
              title: "Add Category",
              params: req.body.category,
            });
          } else {
            const category_name = category.toLowerCase();
            pool.query(
              "INSERT INTO product_category (category) VALUES ($1)",
              [category_name],
              (err, results) => {
                if (err) {
                  throw err;
                }

                console.log(results.rows);
                pool.query(
                  `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Add New Category')`
                );
                req.flash("success", "Successfully create a new category");
                res.redirect("/admin/item-list");
              }
            );
          }
        }
      );
    }
  }
);

// Edit data product
app.get(
  "/admin/item-list/edit/:item_name",
  checkNotAuthenticated,
  isAdmin,
  (req, res) => {
    const sql = `SELECT * FROM items where item_name = '${req.params.item_name}'`;
    pool.query(sql, (err, result) => {
      if (err) {
        return console.error(err.message);
      }

      pool.query(
        `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Edit Item Detail Page')`
      );
      const checkCategory = `SELECT * FROM product_category`;
      pool.query(checkCategory, (err, resullt) => {
        if (err) {
          return console.error(err.message);
        }
        res.render("item-edit", {
          title: "Edit Data Product",
          layout: "layouts/main-layout",
          model: result.rows[0],
          categories: resullt.rows
        });
      });
    });
  }
);

// Edit Product
app.post(
  "/admin/item-list/update",
  checkNotAuthenticated,
  isAdmin,
  upload.array("img", 1),
  async (req, res) => {
    let img;
    if (!req.files.find((e) => e.filename)) {
      img = "default.jpg";
    } else {
      img = req.files[0].filename;
    }
    let item_name = req.body.item_name;
    let category = req.body.category;
    let price = req.body.price;
    let quantity = req.body.quantity;

    let oldName = req.body.oldName;
    let oldCategory = req.body.oldCategory;
    let oldPrice = req.body.oldPrice;
    let oldQuantity = req.body.oldQuantity;
    let oldItemImage = req.body.oldItemImage;

    if (img === "default.jpg") {
      img = oldItemImage;
    }

    console.log({
      oldName,
      oldCategory,
      oldPrice,
      oldQuantity,
      oldItemImage,
      item_name,
      category,
      price,
      quantity,
      img,
    });

    const errors = [];

    if (img === undefined) {
      errors.push({ message: "Please insert an image" });
    }
    if (category === undefined || category === "undefined") {
      errors.push({ message: "Please select a category" });
    }

    if (quantity < 0 || quantity === "") {
      errors.push({ message: "Invalid amount of quantity" });
    }

    if (price < 0 || quantity === "") {
      errors.push({ message: "Invalid amount of price" });
    }
    pool.query(`SELECT * FROM product_category`, (err, category_name) => {
      if (errors.length > 0) {
        pool.query(
          `SELECT * FROM items WHERE item_name = $1`,
          [oldName],
          (err, results) => {
            if (err) {
              throw err;
            } 
            res.render("item-edit", {
              errors,
              layout: "layouts/main-layout",
              title: "Add Item",
              params: req.body,
              model: results.rows[0],
              categories: category_name.rows,
            });
          })
          } else {
            pool.query(
              `SELECT * FROM items WHERE item_name = $1`,
              [oldName],
              (err, results) => {
                if (err) {
              throw err;
            } else {
              console.log(results.rows);
              const product = item_name;
              pool.query(
                `UPDATE items SET item_name = '${product}', category = '${category}', price = '${price}', quantity = '${oldQuantity}', item_image = '${img}' WHERE item_name='${oldName}'; `,
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  // fs.unlink(
                  //   `./public/images/products/${results.rows[0].item_image}`,
                  //   (err) => {
                  //     if (err) throw err;
                  //     console.log("successfully deleted image");
                  //   }
                  // )
                  pool.query(
                    "INSERT INTO product_history (date , product_name, details, quantity, category) VALUES (NOW(), $1, $2, $3, $4) RETURNING id",
                    [
                      oldName + " -> " + item_name,
                      "Update Product Detail",
                      oldQuantity,
                      oldCategory + " -> " + category,
                    ],
                    (err, result) => {
                      if (err) {
                        throw err;
                      }
                      pool.query(
                        `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Update Product Item')`
                      );

                      console.log(results.rows);
                      req.flash("success", "Successfully edit a product");
                      res.redirect("/admin/item-list");
                    }
                  );
                }
              );
            }
          }
        );
      }
    });
  }
);

// Edit quantity product
app.get(
  "/admin/item-list/edit-quantity/:item_name",
  checkNotAuthenticated,
  isAdmin,
  (req, res) => {
    const sql = `SELECT * FROM items where item_name = '${req.params.item_name}'`;
    pool.query(sql, (err, result) => {
      if (err) {
        return console.error(err.message);
      }

      pool.query(
        `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Edit Item Detail Page')`
      );
      const checkCategory = `SELECT * FROM product_category`;
      pool.query(checkCategory, (err, resullt) => {
        if (err) {
          return console.error(err.message);
        }
        res.render("edit-quantity", {
          title: "Edit Quantity Product",
          layout: "layouts/main-layout",
          model: result.rows[0],
          categories: resullt.rows
        });
      });
    });
  }
);


// Change product quantity
app.post(
  "/admin/item-list/edit-quantity/update",
  checkNotAuthenticated,
  isAdmin,
  async (req, res) => {
    let quantity = req.body.quantity;
    let oldQuantity = req.body.oldQuantity;
    let oldName = req.body.oldName;
    let oldCategory = req.body.oldCategory;
    

    console.log({
      oldQuantity,
      quantity,
      oldName,
      oldCategory,
    });

    const errors = [];
    if (quantity < 0 || quantity === "") {
      errors.push({ message: "Invalid amount of quantity" });
    }

    pool.query(`SELECT * FROM product_category`, (err, category_name) => {
      if (errors.length > 0) {
        pool.query(
          `SELECT * FROM items WHERE item_name = $1`,
          [oldName],
          (err, results) => {
            if (err) {
              throw err;
            } 
            res.render("edit-quantity", {
              errors,
              layout: "layouts/main-layout",
              title: "Add Item",
              params: req.body,
              model: results.rows[0],
              categories: category_name.rows,
            });
          })
          } else {
            pool.query(
              `SELECT * FROM items WHERE item_name = $1`,
              [oldName],
              (err, results) => {
                if (err) {
              throw err;
            } else {
              console.log(results.rows);
              pool.query(
                `UPDATE items SET quantity = '${quantity}' WHERE item_name='${oldName}'; `,
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  // fs.unlink(
                  //   `./public/images/products/${results.rows[0].item_image}`,
                  //   (err) => {
                  //     if (err) throw err;
                  //     console.log("successfully deleted image");
                  //   }
                  // )
                  pool.query(
                    "INSERT INTO product_history (date , product_name, details, quantity, category) VALUES (NOW(), $1, $2, $3, $4) RETURNING id",
                    [
                      oldName,
                      "Update Product Quantity",
                      oldQuantity + ' -> ' + quantity,
                      oldCategory,
                    ],
                    (err, result) => {
                      if (err) {
                        throw err;
                      }
                      pool.query(
                        `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Update Product Quantity')`
                      );

                      console.log(results.rows);
                      req.flash("success", "Successfully edit a product");
                      res.redirect("/admin/item-list");
                    }
                  );
                }
              );
            }
          }
        );
      }
    });
  }
);

// Delete Product
app.get(
  "/admin/item-list/delete/:item_name",
  checkNotAuthenticated,
  isAdmin,
  (req, res) => {
    const item = req.params.item_name;
    pool.query(
      `SELECT * FROM items where item_name = '${item}'`,
      (err, results) => {
        if (err) {
          throw err;
        }
        if (results.rows.length < 1) {
          req.flash("error", "Product not found");
          res.redirect("/admin/item-list");
        } else {
          pool.query(
            "INSERT INTO product_history (date , product_name, details, quantity, category) VALUES (NOW(), $1, $2, $3, $4) RETURNING id",
            [
              item,
              "Remove Product",
              results.rows[0].quantity,
              results.rows[0].category,
            ],
            (err, result) => {
              if (err) {
                return console.error(err.message);
              }
              fs.unlink(
                `./public/images/products/${results.rows[0].item_image}`,
                (err) => {
                  if (err) throw err;
                  console.log("successfully deleted image");
                }
              );
              const sql = `DELETE FROM items where item_name = '${item}'`;
              pool.query(sql, (err, result) => {
                if (err) {
                  return console.error(err.message);
                } else {
                  console.log(results.rows);
                  pool.query(
                    `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Deleting Product item')`
                  );
                  req.flash("success", "Successfully Delete a product");
                  res.redirect("/admin/item-list");
                }
              });
            }
          );
        }
      }
    );
  }
);

// Delete User Data
app.get(
  "/user-list/delete/:username",
  checkNotAuthenticated,
  isAdmin,
  (req, res) => {
    const item = req.params.username;
    pool.query(
      `SELECT * FROM users WHERE username = '${item}'`,
      (err, results) => {
        if (err) {
          throw err;
        }
        if (results.rows.length < 1) {
          req.flash("error", "User not found");
          res.redirect("/admin/user-list");
        } else {
          const sql = `DELETE FROM users WHERE username = '${item}'`;
          pool.query(sql, (err, result) => {
            if (err) {
              return console.error(err.message);
            } else {
              pool.query(
                `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Delete User')`
              );
              console.log(results.rows);
              req.flash("success", "Successfully Delete a user");
              res.redirect("/admin/user-list");
            }
          });
        }
      }
    );
  }
);

// Delete History Product
app.get(
  "/admin/item-history/delete/:id",
  checkNotAuthenticated,
  isAdmin,
  (req, res) => {
    const id = req.params.id;
    pool.query(
      `SELECT * FROM product_history where id = ${id}`,
      (err, results) => {
        if (err) {
          throw err;
        }
        if (results.rows.length < 1) {
          req.flash("error", "Product History not found");
          res.redirect("/admin/item-history");
        }
        const sql = `DELETE FROM product_history where id = ${id}`;
        pool.query(sql, (err, result) => {
          if (err) {
            return console.error(err.message);
          } else {
            console.log(results.rows);
            pool.query(
              `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Delete Product History')`
            );
            req.flash("success", "Successfully delete history product");
            res.redirect("/admin/item-history");
          }
        });
      }
    );
  }
);

// Page Item Listtory
app.get("/admin/item-history", checkNotAuthenticated, isAdmin, (req, res) => {
  const sql = `SELECT *  FROM product_history ORDER BY id `;
  pool.query(sql, [], (err, results) => {
    if (err) {
      return console.error(err.message);
    }
    pool.query(
      `INSERT INTO public.log_app(id_user, username, activity) VALUES (${req.user.id}, '${req.user.username}' ,'Access Product History Page')`
    );
    res.render("item-history", {
      title: "Item List",
      layout: "layouts/main-layout",
      msg: req.flash("msg"),
      model: results.rows,
      moment,
    });
  });
});

app.use("/", (req, res) => {
  res.status(404);
  res.render("error-404", {layout: "layouts/login-layout", title: '404 not found'})
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/admin/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

function isAdmin(req, res, next) {
  if (req.user.role === "admin") {
    return next();
  }
  res.redirect("/error");
}

function isUser(req, res, next) {
  if (req.user.role === "user" || req.user.role === "admin") {
    return next();
  }
  res.redirect("/error");
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
