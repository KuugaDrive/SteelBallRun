# SMART-BRIN 

**Sistem Monitoring dan Administrasi Riset Terintegrasi - Badan Riset dan Inovasi Nasional**

SMART-BRIN adalah aplikasi web untuk manajemen dan monitoring capaian riset di Pusat Riset Sains Data dan Informasi (PRSDI) - BRIN. Sistem ini memungkinkan peneliti untuk melaporkan pencapaian mereka dan tim monev untuk melakukan evaluasi secara terintegrasi.

## 🚀 Fitur Utama

### Dashboard Capaian PRSDI
- **KPI Cards**: Menampilkan metrik utama seperti total publikasi, dana eksternal, kekayaan intelektual, dan jumlah periset aktif
- **Visualisasi Data**: Charts interaktif untuk analisis tren publikasi, distribusi jenis dokumen, dan capaian berdasarkan kelompok riset
- **Progress Tracking**: Monitor pencapaian target dengan progress bar dan tren data
- **Responsive Design**: Optimized untuk desktop, tablet, dan mobile

### Manajemen Dokumen Riset
- **Publikasi Global**: Tracking artikel jurnal, prosiding, dan dokumen ilmiah lainnya
- **Kekayaan Intelektual**: Manajemen hak cipta, paten, dan HaKI lainnya
- **Dana Eksternal**: Monitoring kerjasama dan pendanaan eksternal
- **SDM Studi Lanjut**: Tracking pengembangan kapasitas SDM
- **Purwarupa**: Manajemen prototype dan produk riset
- **PDVR**: Program postdoc, visiting researcher, dan pelatihan

### Sistem Role-Based Access
- **Researcher**: Input dan update data riset
- **Head**: Approval dan oversight dokumen
- **Monev**: Review, evaluasi, dan memberikan catatan

### Fitur Monitoring & Evaluasi
- **Status Tracking**: Real-time status dokumen (Submit, Review, Approved, Rejected)
- **Catatan Monev**: Sistem feedback dari tim evaluasi
- **Export Data**: Export data ke Excel untuk reporting
- **Filtering**: Filter berdasarkan kelompok riset dan periode

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 10
- **Database**: MySQL
- **Authentication**: Laravel Sanctum
- **API**: RESTful API architecture

### Frontend
- **Framework**: React 18 dengan TypeScript
- **UI Library**: Tailwind CSS
- **Charts**: Recharts untuk visualisasi data
- **Icons**: Lucide React
- **Routing**: Inertia.js (Laravel + React integration)

### Additional Libraries
- **Excel Export**: xlsx, file-saver
- **Date Handling**: Built-in JavaScript Date
- **State Management**: React Hooks

## 📋 Prasyarat

Pastikan sistem Anda memiliki:
- **PHP**: >= 8.1
- **Node.js**: >= 16.x
- **NPM**: >= 8.x
- **Composer**: Latest version
- **MySQL**: >= 8.0
- **Git**: Latest version

## 🔧 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/your-username/smart-brin.git
cd smart-brin
```

### 2. Install Dependencies
```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### 3. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Database Configuration
Edit file `.env` dan sesuaikan konfigurasi database:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smart_brin
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 5. Database Migration & Seeding
```bash
# Run migrations
php artisan migrate

# Run seeders (optional)
php artisan db:seed
```

### 6. Build Assets
```bash
# Development build
npm run dev

# Production build
npm run build
```

### 7. Start Development Server
```bash
# Start Laravel server
php artisan serve

# In another terminal, start Vite dev server
npm run dev
```

Aplikasi akan tersedia di: `http://localhost:8000`

## 🏗️ Struktur Project

```
smart-brin/
├── app/                    # Laravel application logic
│   ├── Http/Controllers/   # Controllers
│   ├── Models/            # Eloquent models
│   └── ...
├── database/              # Migrations, seeders, factories
├── resources/
│   ├── js/               # React/TypeScript frontend
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── layouts/      # Layout components
│   │   └── types/        # TypeScript definitions
│   └── views/            # Blade templates
├── routes/               # Application routes
├── public/               # Public assets
└── ...
```

## 📱 Usage Guide

### Login & Authentication
1. Access aplikasi melalui browser
2. Login menggunakan kredensial yang telah diberikan
3. Dashboard akan menampilkan overview capaian PRSDI

### Input Data (Researcher)
1. Navigasi ke halaman "Details"
2. Pilih tab sesuai jenis dokumen
3. Klik tombol "Input" atau "Update" untuk menambah/mengubah data
4. Isi form dengan lengkap dan submit

### Review & Evaluasi (Monev)
1. Akses halaman "Details" 
2. Review dokumen yang di-submit
3. Berikan status (Approved/Rejected/Revised)
4. Tambahkan catatan evaluasi jika diperlukan
5. Beri stamp monev untuk dokumen yang sudah direview

### Export Data
1. Pilih tab data yang ingin di-export
2. Klik tombol "Export Data"
3. Pilih "Export Excel" 
4. File akan otomatis ter-download

## 🔐 User Roles

### Researcher
- Input dan update data riset
- View dashboard capaian
- Export data pribadi
- Melihat feedback dari monev

### Head
- Approval dokumen dari researcher
- Access ke semua data kelompok riset
- Dashboard overview lengkap

### Monev
- Review dan evaluasi semua dokumen
- Memberikan catatan dan status approval
- Stamp dokumen yang sudah direview
- Generate report evaluasi

## 🎨 UI/UX Features

### Responsive Design
- **Mobile-first**: Optimized untuk smartphone
- **Tablet-friendly**: Layout adaptif untuk tablet
- **Desktop**: Full features untuk desktop

### Accessibility
- **Color contrast**: Memenuhi standar WCAG
- **Keyboard navigation**: Fully accessible via keyboard
- **Screen reader**: Compatible dengan screen reader

### Performance
- **Code splitting**: Lazy loading untuk performa optimal
- **Caching**: Smart caching untuk data yang sering diakses
- **Optimized images**: Compressed dan optimized assets

## 🐛 Troubleshooting

### Common Issues

**1. Composer install error**
```bash
# Clear composer cache
composer clear-cache
composer install --no-cache
```

**2. NPM build error**
```bash
# Clear NPM cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**3. Database connection error**
- Pastikan MySQL service running
- Check kredensial di file `.env`
- Verify database telah dibuat

**4. Permission error (Linux/Mac)**
```bash
chmod -R 775 storage bootstrap/cache
```

## 🔄 Update & Deployment

### Development Update
```bash
git pull origin main
composer install
npm install
php artisan migrate
npm run build
```

### Production Deployment
```bash
# Set production environment
APP_ENV=production
APP_DEBUG=false

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer install --optimize-autoloader --no-dev
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- Follow PSR-12 untuk PHP
- Use ESLint config untuk TypeScript/React
- Write tests untuk fitur baru
- Update documentation

## 📄 License


---

**SMART-BRIN** v1.0.0 - Dikembangkan untuk PRSDI BRIN KST Samaun Samadikun Bandung
=======
# smart-brin



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://git.brin.go.id/smart_brin/smart-brin.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://git.brin.go.id/smart_brin/smart-brin/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
* [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> eb9b7706d9a4a4de55ee17c18117c18a4b187a6e
