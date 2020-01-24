


docker image build -t krocon/node-web-extractor:1.0 .

docker ps

docker container run --publish 80:3000 --detach --name nwe node-web-extractor:1.0

docker push krocon/node-web-extractor:1.0
