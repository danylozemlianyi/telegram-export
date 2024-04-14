cd admin_page
docker build -t admin_page .
docker tag admin_page *gcr_repo*/admin_page:latest
gcloud auth configure-docker europe-central2-docker.pkg.dev
docker push admin_page *gcr_repo*/admin_page:latest

To apply - create a new revision of admin-page Cloud Run service on port 80 with updated container