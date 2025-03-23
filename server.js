const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const configDir = path.join(__dirname, 'json/pages');
const sidebarPath = path.join(__dirname, 'json/components/sidebar.json');

app.get("/api/json/:category/:page", (req, res) => {
    const { category, page } = req.params;
    const filePath = path.join(__dirname, "json", category, `${page}.json`);

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return res.status(404).json({ error: "UI configuration not found" });

        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            res.status(500).json({ error: "Invalid JSON format" });
        }
    });
});

app.post("/authenticate", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin" && password === "admin") {
        res.json({ success: true, message: "Login Successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid Credentials" });
    }
});

app.post('/api/json/create', (req, res) => {
    const { title, content, addToSidebar } = req.body;
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.json`;
    const filepath = path.join(configDir, filename);

    fs.writeFile(filepath, JSON.stringify(content, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to create JSON file' });

        if (addToSidebar) {
            fs.readFile(sidebarPath, 'utf8', (err, data) => {
                if (!err) {
                    let sidebar = JSON.parse(data);
                    sidebar.menuItems.push({ label: title, action: `/${title.toLowerCase()}`, icon: "bi bi-file-earmark" });

                    fs.writeFile(sidebarPath, JSON.stringify(sidebar, null, 2), (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to update sidebar' });
                        res.json({ message: 'Page/Component created successfully and added to sidebar.' });
                    });
                } else {
                    res.status(500).json({ error: 'Failed to read sidebar file' });
                }
            });
        } else {
            res.json({ message: 'Page/Component created successfully.' });
        }
    });
});

app.get('/api/json/list', (req, res) => {
    fs.readdir(configDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Error reading directory' });
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        res.json(jsonFiles);
    });
});

app.get('/api/json/load/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(configDir, filename);

    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ error: `File not found: ${filename}` });
        res.json(JSON.parse(data));
    });
});

app.post('/api/json/save/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(configDir, filename);
    const content = JSON.stringify(req.body, null, 2);

    fs.writeFile(filepath, content, (err) => {
        if (err) return res.status(500).json({ error: 'Error saving file' });
        res.json({ message: 'File saved successfully' });
    });
});

app.get('/api/dashboard-stats', (req, res) => {
    const filePath = path.join(__dirname, 'dashboardData.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading dashboard data:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json(JSON.parse(data));
    });
  });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
