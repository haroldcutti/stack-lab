import express from "express";
import morgan from "morgan";
import { engine } from 'express-handlebars';
import { join, dirname } from 'path';
import { fileURLToPath } from "url";
import mysql from 'mysql';

//Inicialización
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stack'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos establecida correctamente');
});

//Settings
app.set('port', process.env.PORT || 3000);

app.set('views', join(__dirname, 'views'));

app.engine('.hbs', engine({
    defaultLayout: 'main',
    layoutsDir: join(app.get('views'), 'layout'),
    partialsDir: join(app.get('views'), 'partials'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs');

//Middlewares
app.use(morgan('dev'));

app.use(express.urlencoded({ extended: false}));
app.use(express.json());

//Routes
app.get('/', (req, res)=>{
    res.render('partials/navigation')
})

app.get('/tienda', (req, res) => {
    res.render('partials/tienda');
});

app.get('/productos', (req, res) => {
    const nombre = req.query.nombre;

    if (!nombre) {
        connection.query('SELECT * FROM productos', (errorProductos, productos) => {
            if (errorProductos) {
                console.error('Error al obtener productos:', errorProductos);
                res.status(500).send('Error al obtener productos');
                return;
            }

            connection.query('SELECT * FROM categorias', (errorCategorias, categorias) => {
                if (errorCategorias) {
                    console.error('Error al obtener categorías:', errorCategorias);
                    res.status(500).send('Error al obtener categorías');
                    return;
                }

                res.render('partials/productos', { productos, categorias });
            });
        });
    } else {
        const query = 'SELECT * FROM productos WHERE nombre LIKE ?';
        const searchTerm = `%${nombre}%`;

        connection.query(query, [searchTerm], (error, productos) => {
            if (error) {
                console.error('Error al obtener productos:', error);
                res.status(500).send('Error al obtener productos');
                return;
            }

            connection.query('SELECT * FROM categorias', (errorCategorias, categorias) => {
                if (errorCategorias) {
                    console.error('Error al obtener categorías:', errorCategorias);
                    res.status(500).send('Error al obtener categorías');
                    return;
                }

                res.render('partials/productos', { productos, categorias });
            });
        });
    }
});

app.get('/categorias', (req, res) => {
    const nombre = req.query.nombre;

    if (!nombre) {
        connection.query('SELECT * FROM categorias', (error, results) => {
            if (error) {
                console.error('Error al obtener categorías:', error);
                res.status(500).send('Error al obtener categorías');
            } else {
                res.render('partials/categorias', { categorias: results });
            }
        });
    } else {
        const query = 'SELECT * FROM categorias WHERE nombre LIKE ?';
        const searchTerm = `%${nombre}%`;
        connection.query(query, [searchTerm], (error, results) => {
            if (error) {
                console.error('Error al obtener categorías:', error);
                res.status(500).send('Error al obtener categorías');
            } else {
                res.render('partials/categorias', { categorias: results });
            }
        });
    }
});

//Public Files
app.use(express.static(join(__dirname, 'public')));

//Run server
app.listen(app.get('port'), () =>
    console.log('Cargando el puerto', app.get('port'))
);

app.post('/agregar_categoria', (req, res) => {
    const { nombre } = req.body;
    
    connection.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre], (error, results) => {
        if (error) {
            console.error('Error al agregar la categoría:', error);
            res.status(500).send('Error al agregar la categoría');
        } else {
            console.log('Categoría agregada correctamente');
            res.redirect('/categorias'); 
        }
    });
});

app.post('/editar_categoria/:id', (req, res) => {
    const categoryId = req.params.id;
    const newCategoryName = req.body.nombre; 

    connection.query('UPDATE categorias SET nombre = ? WHERE id = ?', [newCategoryName, categoryId], (error, results) => {
        if (error) {
            console.error('Error al editar la categoría:', error);
            res.status(500).send('Error al editar la categoría');
        } else {
            console.log('Categoría editada correctamente');
            res.redirect('/categorias');
        }
    });
});

app.post('/eliminar_categoria/:id', (req, res) => {
    const categoryId = req.params.id;

    connection.query('DELETE FROM categorias WHERE id = ?', [categoryId], (error, results) => {
        if (error) {
            console.error('Error al eliminar la categoría:', error);
            res.status(500).send('Error al eliminar la categoría');
        } else {
            console.log('Categoría eliminada correctamente');
            res.redirect('/categorias'); 
        }
    });
});

app.post('/agregar_producto', (req, res) => {
    const { nombre, descripcion, precio, categoria } = req.body;

    connection.query('INSERT INTO productos (nombre, descripcion, precio, categoria_id) VALUES (?, ?, ?, ?)', 
        [nombre, descripcion, precio, categoria], 
        (error, results) => {
            if (error) {
                console.error('Error al agregar el producto:', error);
                res.status(500).send('Error al agregar el producto');
            } else {
                console.log('Producto agregado correctamente');
                res.redirect('/productos'); 
            }
        }
    );
});

app.post('/editar_producto/:id', (req, res) => {
    const productId = req.params.id;
    const { nombre, descripcion, precio, categoria } = req.body;

    connection.query('UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, categoria_id = ? WHERE id = ?', 
        [nombre, descripcion, precio, categoria, productId], 
        (error, results) => {
            if (error) {
                console.error('Error al editar el producto:', error);
                res.status(500).send('Error al editar el producto');
            } else {
                console.log('Producto editado correctamente');
                res.redirect('/productos');
            }
        }
    );
});

app.post('/eliminar_producto/:id', (req, res) => {
    const productId = req.params.id;

    connection.query('DELETE FROM productos WHERE id = ?', [productId], (error, results) => {
        if (error) {
            console.error('Error al eliminar el producto:', error);
            res.status(500).send('Error al eliminar el producto');
        } else {
            console.log('Producto eliminado correctamente');
            res.redirect('/productos'); 
        }
    });
});