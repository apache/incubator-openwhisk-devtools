#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

SHELL:=/bin/bash
UNAME_STR ?= $(shell uname)

# detect local ip of host as this is needed within containers to find the OpenWhisk API container
ifeq ("$(UNAME_STR)","Linux")
	LOCAL_IP=$(shell LANG=en_US.utf8; route | grep default | tr -s " " | cut -d " " -f 8 | xargs env ifconfig | grep "inet addr:" | cut -d ":" -f 2 | cut -d " " -f 1)
	# inet addr: not present, trying with inet.
	ifeq ($(LOCAL_IP), )
		LOCAL_IP=$(shell route | grep default | tr -s " " | cut -d " " -f 8 | xargs env ifconfig | grep "inet " | tr -s " " | cut -d " " -f 3)
	endif
else
	LOCAL_IP ?= $(shell ifconfig | grep "inet " | grep -v 127.0.0.1 | cut -d\  -f2 | head -1)
endif
# if no IP was found, fallback to "localhost"
ifeq ($(LOCAL_IP), )
	LOCAL_IP = "localhost"
endif

DOCKER_HOST_IP ?= $(shell echo ${DOCKER_HOST} | grep -o "[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" || echo ${LOCAL_IP})
DOCKER_REGISTRY ?= ""
DOCKER_IMAGE_PREFIX ?= openwhisk
DOCKER_IMAGE_TAG ?= nightly
OPENWHISK_VERSION ?= master
OPENWHISK_PROJECT_HOME ?= $(CURDIR)/openwhisk-src
OPENWHISK_CATALOG_HOME ?= $(CURDIR)/openwhisk-catalog
WSK_CLI ?= $(OPENWHISK_PROJECT_HOME)/bin/wsk
WSK_CLI_VERSION ?= latest
WSK_CONFIG_FILE=$(CURDIR)/.wskprops
OPEN_WHISK_DB_PREFIX ?= local_
TMP_HOME ?= ~

DOCKER_KERNEL ?= $(shell docker version --format "{{.Server.KernelVersion}}")
DOCKER_COMPOSE_FILE=docker-compose.yml

ifeq ("$(UNAME_STR)","Linux")
	DOCKER_BINARY ?= $(shell (which docker))
else
	DOCKER_BINARY ?= $(shell if [[ $(DOCKER_KERNEL) == *-moby || $(DOCKER_KERNEL) ==  *-boot2docker ]]; then (docker run --rm --privileged --pid=host debian nsenter -t 1 -m -u -n -i sh -c "which docker"); else (which docker); fi)
endif
ifndef VERBOSE
.SILENT:
endif

# Quick-Start is a simple way to get started with OpenWhisk locally
#   1. at start it builds the project and the docker containers
#   2. then it starts all components using docker-compose
#   3. it runs a sample hello-world function
#   To stop and cleanup the environment use: make destroy

lean:	DOCKER_COMPOSE_FILE=docker-compose-lean.yml
lean:	download-src download-cli docker-pull-lean run hello-world quick-start-info

quick-start: download-src download-cli docker-pull run quick-start-pause hello-world quick-start-info

add-catalog: download-catalog init-catalog

.PHONY: download-src
download-src:
	if [ ! $(OPENWHISK_PROJECT_HOME) = "$(CURDIR)/openwhisk-src" ]; then \
		echo "Skipping downloading the code as OPENWHISK_PROJECT_HOME is set to " $(OPENWHISK_PROJECT_HOME); \
	else \
		rm -rf $(CURDIR)/openwhisk-src; \
		curl -s -o ./openwhisk-src.tar.gz -L https://github.com/apache/openwhisk/archive/$(OPENWHISK_VERSION).tar.gz; \
		echo "Unpacking tarball."; \
	    mkdir -p $(OPENWHISK_PROJECT_HOME); \
	    tar -xf ./openwhisk-src.tar.gz --strip 1 -C $(OPENWHISK_PROJECT_HOME); \
	    rm ./openwhisk-src.tar.gz; \
	fi

.PHONY: download-catalog
download-catalog:
	if [ "$(OPENWHISK_CATALOG_HOME)" = "$(CURDIR)/openwhisk-catalog" ]; then \
	    rm -rf $(CURDIR)/openwhisk-catalog*; \
	    curl -s --output ./openwhisk-catalog.tar.gz -L https://api.github.com/repos/apache/openwhisk-catalog/tarball/master; \
	    mkdir openwhisk-catalog; \
	    tar -xf ./openwhisk-catalog.tar.gz --strip 1 -C openwhisk-catalog; \
	else \
	     echo "Skipping downloading the code from git as OPENWHISK_CATALOG_HOME is not default:" $(OPENWHISK_CATALOG_HOME); \
	fi

.PHONY: quick-start-pause
quick-start-pause:
	echo "waiting for the Whisk invoker to come up ... "
	# removed --head from this curl because of an upstream change https://github.com/apache/openwhisk/pull/4494
	until $$(curl -s --output /dev/null --silent --fail http://$(DOCKER_HOST_IP):8085/ping); do printf '.'; sleep 5; done
	echo " ... OK"
	sleep 30

.PHONY: quick-start-info
quick-start-info:
	echo "$$(tput setaf 2)To invoke the function again use: $$(tput setaf 6)make hello-world$$(tput sgr0)"
	echo "$$(tput setaf 2)To stop OpenWhisk use: $$(tput setaf 6)make destroy$$(tput sgr0)"
	echo "$$(tput setaf 2)To use the wsk CLI: $$(tput setaf 6)export WSK_CONFIG_FILE=$(WSK_CONFIG_FILE)$$(tput sgr0)"
	echo "                    $$(tput setaf 6)or copy the file to $(HOME)/.wskprops$$(tput sgr0)"
# deprecated commands
.PHONY: docker_build
docker_build:
	echo "$$(tput setaf 2)ERROR: command deprecated"
	echo "$$(tput setaf 2)please use $$(tput setaf 3)$$ $$(tput setaf 4)make docker-build$$(tput sgr0)"

.PHONY: docker_pull
docker_pull:
	echo "$$(tput setaf 2)ERROR: command deprecated"
	echo "please use $$(tput setaf 3)$$ $$(tput setaf 4)make docker-pull$$(tput sgr0)"

.PHONY: docker_pull_full
docker_pull_full:
	echo "$$(tput setaf 2)ERROR: command deprecated"
	echo "please use $$(tput setaf 3)$$ $$(tput setaf 4)make docker-pull-full$$(tput sgr0)"

.PHONY: docker-build
docker-build:
	echo "building the OpenWhisk core docker images ... "
	cd $(OPENWHISK_PROJECT_HOME) && \
		./gradlew distDocker -PdockerImagePrefix=$(DOCKER_IMAGE_PREFIX) -PdockerImageTag=${DOCKER_IMAGE_TAG}

.PHONY: docker-pull-lean
docker-pull-lean:
	docker pull $(DOCKER_IMAGE_PREFIX)/controller:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/nodejs6action:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/dockerskeleton:${DOCKER_IMAGE_TAG}

.PHONY: docker-pull
docker-pull:	docker-pull-lean
	echo "pulling the docker images short list... "
	docker pull $(DOCKER_IMAGE_PREFIX)/invoker:${DOCKER_IMAGE_TAG}

.PHONY: docker-pull-full
docker-pull-full:
	echo "pulling the docker images full list ... "
	docker pull $(DOCKER_IMAGE_PREFIX)/controller:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/invoker:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/nodejs6action:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-nodejs-v8:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-nodejs-v10:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-nodejs-v12:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/python2action:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/python3action:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-swift-v4.2:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-swift-v5.1:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/java8action:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-php-v7.3:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-php-v7.4:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-ruby-v2.5:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-golang-v1.11:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/dockerskeleton:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-dotnet-v2.2:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-dotnet-v3.1:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-ballerina-v0.990.2:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/action-rust-v1.34:${DOCKER_IMAGE_TAG}
	docker pull $(DOCKER_IMAGE_PREFIX)/dockerskeleton:${DOCKER_IMAGE_TAG}

download-cli:
	echo "downloading the CLI tool ... "
	if [ ! -e "$(WSK_CLI)" ]; then \
        if [ "$(UNAME_STR)" = "Darwin" ]; then \
          echo "downloading cli for mac" ; \
          curl -s -o $(OPENWHISK_PROJECT_HOME)/bin/wsk.zip -L https://github.com/apache/openwhisk-cli/releases/download/$(WSK_CLI_VERSION)/OpenWhisk_CLI-$(WSK_CLI_VERSION)-mac-amd64.zip ; \
            cd $(OPENWHISK_PROJECT_HOME)/bin ; \
        unzip -o wsk.zip; \
        elif [ "$(UNAME_STR)" = "Linux" ]; then \
          echo "downloading cli for linux" ; \
          curl -s -o $(OPENWHISK_PROJECT_HOME)/bin/wsk.tgz -L https://github.com/apache/openwhisk-cli/releases/download/$(WSK_CLI_VERSION)/OpenWhisk_CLI-$(WSK_CLI_VERSION)-linux-amd64.tgz ; \
            cd $(OPENWHISK_PROJECT_HOME)/bin ; \
            tar -xf wsk.tgz ; \
        fi; \
	else \
         echo "Skipping downloading the cli as OPENWHISK_PROJECT_HOME is set to " $(OPENWHISK_PROJECT_HOME); \
	fi

.PHONY: run
run: print-host check-required-ports setup start-docker-compose wait-for-docker-compose-up init-couchdb init-whisk-cli init-api-management

print-host:
	echo "host ip address: ${DOCKER_HOST_IP}"

.PHONY: check-required-ports
check-required-ports:
	echo "checking required ports ... "
	@occupiedports=0; \
	for port in 2888 5984 8085 8888 9092 8001; do \
		pid=`lsof -Pi :$$port -sTCP:LISTEN -t` ; \
		if [ ! -z "$$pid" ];  then let "occupiedports+=1" ; echo "$$(tput setaf 1)Port $$port is taken by PID:$$pid.$$(tput sgr0)"; fi; \
	done; \
	if [ "$$occupiedports" = 0 ]; then \
		echo " ... OK"; \
	else \
		echo "$$(tput setaf 2)Ports occupied. To stop openwhisk use: $$(tput setaf 4)make destroy$$(tput setaf 2) or: $$(tput setaf 4)make stop$$(tput sgr0)"; \
		exit 1; \
	fi

.PHONY: check-alarm-ports
check-alarm-ports:
	echo "checking required ports ... "
	for port in 8081; do \
		pid=`lsof -Pi :$$port -sTCP:LISTEN -t` ; \
		if [ ! -z "$$pid" ];  then echo "$$(tput setaf 1)Port $$port is taken by PID:$$pid.$$(tput sgr0)"; exit 1; fi; \
	done
	echo " ... OK"

.PHONY: check-cloudant-ports
check-cloudant-ports:
	echo "checking required ports ... "
	for port in 8082; do \
		pid=`lsof -Pi :$$port -sTCP:LISTEN -t` ; \
		if [ ! -z "$$pid" ];  then echo "$$(tput setaf 1)Port $$port is taken by PID:$$pid.$$(tput sgr0)"; exit 1; fi; \
	done
	echo " ... OK"

.PHONY: check-kafka-ports
check-kafka-ports:
	echo "checking required ports ... "
	for port in 5000; do \
		pid=`lsof -Pi :$$port -sTCP:LISTEN -t` ; \
		if [ ! -z "$$pid" ];  then echo "$$(tput setaf 1)Port $$port is taken by PID:$$pid.$$(tput sgr0)"; exit 1; fi; \
	done
	echo " ... OK"

.PHONY: setup
setup:
	mkdir -p $(TMP_HOME)/tmp/openwhisk
	> $(TMP_HOME)/tmp/openwhisk/local.env
	printf "DOCKER_BINARY=$(DOCKER_BINARY)\n" >> $(TMP_HOME)/tmp/openwhisk/local.env
	printf "DOCKER_COMPOSE_HOST=$(DOCKER_HOST_IP)\n" >> $(TMP_HOME)/tmp/openwhisk/local.env
	printf "DOCKER_REGISTRY=$(DOCKER_REGISTRY)\n" >> $(TMP_HOME)/tmp/openwhisk/local.env
	printf "DOCKER_IMAGE_PREFIX=$(DOCKER_IMAGE_PREFIX)\n" >> $(TMP_HOME)/tmp/openwhisk/local.env
	printf "DOCKER_IMAGE_TAG=$(DOCKER_IMAGE_TAG)\n" >> $(TMP_HOME)/tmp/openwhisk/local.env

	echo "  ... preparing api-gateway configuration"
	rm -rf $(TMP_HOME)/tmp/openwhisk/api-gateway-config
	mkdir -p $(TMP_HOME)/tmp/openwhisk/api-gateway-config/api-gateway
	mkdir -p $(TMP_HOME)/tmp/openwhisk/api-gateway-ssl
	mkdir -p $(TMP_HOME)/tmp/openwhisk/minio
	cp -r ./apigateway/* $(TMP_HOME)/tmp/openwhisk/api-gateway-config/api-gateway/
	cp -r ./apigateway/rclone $(TMP_HOME)/tmp/openwhisk

	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk up minio 2>&1 > $(TMP_HOME)/tmp/openwhisk/setup.log &

	echo "pinging minio..."
	until (curl --silent http://$(DOCKER_HOST_IP):9001/ > /dev/null); do printf '.'; sleep 5; done
	echo " ... OK"
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk run --rm --no-deps apigateway rclone mkdir minio:api-gateway
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk run --rm --no-deps apigateway rclone copy --exclude .git /etc/api-gateway/ minio:api-gateway/
	# $(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk stop minio
	# $(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk rm -f minio

	# Check if the user has provided SSL certificates, if not generate them
	if [ -f "$(OPENWHISK_PROJECT_HOME)/ansible/roles/nginx/files/openwhisk-server-key.pem" ] && \
		[ -f "$(OPENWHISK_PROJECT_HOME)/ansible/roles/nginx/files/openwhisk-server-cert.pem" ]; then \
			echo "using certificates present in $(OPENWHISK_PROJECT_HOME)/ansible/roles/nginx/files/"; \
	else \
		env bash $(OPENWHISK_PROJECT_HOME)/ansible/files/genssl.sh $(DOCKER_HOST_IP) server $(OPENWHISK_PROJECT_HOME)/ansible/roles/nginx/files; \
	fi;
	mkdir -p $(TMP_HOME)/tmp/openwhisk/api-gateway-ssl
	cp $(OPENWHISK_PROJECT_HOME)/ansible/roles/nginx/files/*.pem $(TMP_HOME)/tmp/openwhisk/api-gateway-ssl

.PHONY: gw
gw:
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk up apigateway

.PHONY: restart
restart: stop rm start-docker-compose

.PHONY: restart-controller
restart-controller:
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk stop controller
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk rm -f controller
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk up controller 2>&1 >> $(TMP_HOME)/tmp/openwhisk/docker-compose.log &
	echo "waiting for the controller to see the invoker is 'up' ... "
	until (curl --silent http://$(DOCKER_HOST_IP):8888/invokers | grep "up"); do printf '.'; sleep 5; done

.PHONY: restart-invoker
restart-invoker:
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk stop invoker
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk rm -f invoker
	echo "waiting for the invoker to be marked 'down' ... "
	until (curl --silent http://$(DOCKER_HOST_IP):8888/invokers | grep "down"); do printf '.'; sleep 5; done
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk up invoker 2>&1 >> $(TMP_HOME)/tmp/openwhisk/docker-compose.log &
	echo "waiting for the invoker to be marked Healthy ... "
	until (curl --silent http://$(DOCKER_HOST_IP):8888/invokers | grep "up"); do printf '.'; sleep 5; done

.PHONY: start-docker-compose
start-docker-compose:
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk -f $(DOCKER_COMPOSE_FILE) up 2>&1 > $(TMP_HOME)/tmp/openwhisk/docker-compose.log &

.PHONY: wait-for-docker-compose-up
wait-for-docker-compose-up:
	echo "Waiting till all containers are powered up... ";
	sleep 1;
	@trycount=0; \
	trycounttimeout=60; \
	up=`$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk ps | grep Up -c`; \
	servicescount=`$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose -f $(DOCKER_COMPOSE_FILE) config --services | wc -l | xargs`; \
	docker_ps() { \
		docker ps --format 'table {{.Image}}\t{{.Status}}' --filter "label=com.docker.compose.project=openwhisk" -a; \
	}; \
	echo_output() { \
		if [ "$(VERBOSE)" != "true" ]; then return;	fi; \
		output=$$(docker_ps); \
		echoprefix=""; \
		if [ "$$trycount" != 0 ]; then \
			lines=$$(echo "$$output" | wc -l | xargs); \
			echoprefix="\033[$${lines}A\033[0J"; \
		fi; \
		echo "$${echoprefix}$$output"; \
	}; \
	until [ "$$up" -eq "$$servicescount" ]; do \
		echo_output; \
	  sleep 1; \
	  up=`$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk ps | grep Up -c`; \
	  if [ "$$up" != "$$servicescount" ]; then \
	    if [ "$$trycount" -eq "$$trycounttimeout" ]; then \
				echo "\n$$(docker_ps)"; \
	      echo "\nERROR: Timed out waiting for docker services to launch..."; \
	      exit 1; \
	    else \
	      let "trycount+=1"; \
	    fi; \
	  fi; \
	done; \
	echo_output;
	echo " ... OK: all containers up!"

.PHONY: stop
stop:
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk stop

.PHONY: rm
rm:
	$(shell cat $(TMP_HOME)/tmp/openwhisk/local.env) docker-compose --project-name openwhisk rm -f

.PHONY: init-couchdb
init-couchdb:
	echo "waiting for the database to come up ... on $(DOCKER_HOST_IP)"
	until $$(curl --output /dev/null --silent --head --fail http://$(DOCKER_HOST_IP):5984/_all_dbs); do printf '.'; sleep 5; done
	echo "initializing the database ... on $(DOCKER_HOST_IP)"
	# make sure the src files are in a shared folder for docker
	mkdir -p $(TMP_HOME)/tmp/openwhisk
	rm -rf $(TMP_HOME)/tmp/openwhisk/src
	rsync -a $(OPENWHISK_PROJECT_HOME)/* $(TMP_HOME)/tmp/openwhisk/src --exclude .git --exclude build --exclude tests
	echo 'Setting up db using ansible container....'; \
    compose_network=$$(docker-compose --project-name openwhisk ps -q db 2>/dev/null | xargs docker inspect -f '{{range $$index, $$element := .NetworkSettings.Networks}}{{$$index}}{{end}}' | head -n 1); \
    db_ip_address=$$(docker-compose --project-name openwhisk ps -q db 2>/dev/null | xargs docker inspect -f "{{.NetworkSettings.Networks.$${compose_network}.IPAddress}}"); \
	docker run --rm -v $(TMP_HOME)/tmp/openwhisk/src:/openwhisk -w /openwhisk/ansible \
		--network="$${compose_network}" -t \
		--add-host="db:$${db_ip_address}" \
		ddragosd/ansible:2.4.0.0-debian8  \
		sh -c "ansible-playbook setup.yml && ansible-playbook couchdb.yml --tags=ini && ansible-playbook initdb.yml wipe.yml \
			-e db_host=db -e openwhisk_home=/openwhisk -e db_prefix=$(OPEN_WHISK_DB_PREFIX)"

.PHONY: init-whisk-cli
init-whisk-cli:
	echo "waiting for the Whisk controller to come up ... "
	# removed --head from this curl because of an upstream change https://github.com/apache/openwhisk/pull/4494
	until $$(curl --output /dev/null --silent --fail http://$(DOCKER_HOST_IP):8888/ping); do printf '.'; sleep 5; done
	echo "initializing CLI properties into $(WSK_CONFIG_FILE)"
	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) property set --auth `cat $(OPENWHISK_PROJECT_HOME)/ansible/files/auth.guest` --apihost https://$(DOCKER_HOST_IP) -i

.PHONY: init-api-management
init-api-management:
	touch $(OPENWHISK_PROJECT_HOME)/whisk.properties
	GW_USER="" \
	GW_PWD="" \
	GW_HOST_V2="http://$(DOCKER_HOST_IP):9000/v2" \
	OPENWHISK_HOME=$(OPENWHISK_PROJECT_HOME) \
	$(OPENWHISK_PROJECT_HOME)/ansible/roles/routemgmt/files/installRouteMgmt.sh $(shell cat $(OPENWHISK_PROJECT_HOME)/ansible/files/auth.whisk.system) $(DOCKER_HOST_IP) /whisk.system $(WSK_CLI)

.PHONY: init-catalog
init-catalog:
	OPENWHISK_HOME=$(OPENWHISK_PROJECT_HOME) $(OPENWHISK_CATALOG_HOME)/packages/installCatalogUsingWskdeploy.sh \
	  `cat $(OPENWHISK_PROJECT_HOME)/ansible/files/auth.whisk.system` \
	  $(DOCKER_HOST_IP):443 \
	  $(WSK_CLI)

.PHONY: destroy
destroy: stop rm
	echo "cleaning other OpenWhisk containers started by the invoker ... "
	-docker ps | grep whisk | awk '{print $$1}' | xargs docker stop | xargs docker rm
	echo "cleaning dangling docker volumes ... "
	docker volume ls -qf dangling=true | xargs docker volume rm
	if [ "$(UNAME_STR)" = "Linux" ]; then \
	  sudo rm -rf $(TMP_HOME)/tmp/openwhisk ;\
	else \
	  rm -rf $(TMP_HOME)/tmp/openwhisk ;\
	fi;
	rm -rf ./openwhisk-master*

# This task runs a hello-world function
#   1. It creates the function
#   2. It executes it
#   3. At the end it deletes it
.PHONY: hello-world
hello-world: create-hello-world-function
	echo "invoking the hello-world function ... "

	echo "$$(tput setaf 4)adding the function to whisk ...$$(tput sgr0)"
	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i action create hello hello.js

	echo "$$(tput setaf 4)invoking the function ...$$(tput sgr0)"
	res=`WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i action invoke hello --blocking --result` \
	    && echo "invocation result:" $$res \
	    && (echo $$res | grep "Hello, World") || (WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i action delete hello && tail -n 200 $(TMP_HOME)/tmp/openwhisk/invoker/logs/invoker-local_logs.log $(TMP_HOME)/tmp/openwhisk/controller/logs/controller-local_logs.log && exit 1)

	echo "$$(tput setaf 4)creating an API from the hello function ...$$(tput sgr0)"
	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i action update "/guest/hello" --web true
	web_action=`WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i api create /hello /world get hello --response-type json | tail -n 1` \
	    && echo "invoking: " $$web_action \
	    && (echo $$web_action | xargs curl -sS | grep "Hello, World") || (echo "Error invoking the web action" && tail -n 200 $(TMP_HOME)/tmp/openwhisk/invoker/logs/invoker-local_logs.log $(TMP_HOME)/tmp/openwhisk/controller/logs/controller-local_logs.log && exit 1)
	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i api list /hello

	echo "$$(tput setaf 1)deleting the API ...$$(tput sgr0)"
	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i api delete /hello

	echo "$$(tput setaf 1)deleting the function ...$$(tput sgr0)"
	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i action delete hello
	rm hello.js

.PHONY: create-hello-world-function
create-hello-world-function:
	echo "$$(tput setaf 2)creating the hello.js function ...$$(tput sgr0)"
	echo 'function main(params) {var name = params.name || "World"; return { payload:  "Hello, " + name + "!" }; }' > hello.js

# Using the hello-world function this task executes a performance test using Apache Benchmark
.PHONY: hello-world-perf-test
hello-world-perf-test: create-hello-world-function
	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i action create hello-perf hello.js

	docker run --rm \
	    --net openwhisk_default \
	    --link controller jordi/ab -k -n 2000 -c 20 \
	    -m POST -H "Authorization:Basic MjNiYzQ2YjEtNzFmNi00ZWQ1LThjNTQtODE2YWE0ZjhjNTAyOjEyM3pPM3haQ0xyTU42djJCS0sxZFhZRnBYbFBrY2NPRnFtMTJDZEFzTWdSVTRWck5aOWx5R1ZDR3VNREdJd1A=" \
	            -H "Content-Type:application/json" \
	            http://controller:8888/api/v1/namespaces/guest/actions/hello-perf?blocking=true

	WSK_CONFIG_FILE=$(WSK_CONFIG_FILE) $(WSK_CLI) -i action delete hello-perf
	rm hello.js

.PHONY: pull
pull: download-src setup
	docker-compose --project-name openwhisk pull

# Optional package configuration stages. These commands will install and set up
# the alarms, cloudant and kakfa packages.
PACKAGES = alarms cloudant kafka
PACKAGE_ALARMS_HOME ?= ./openwhisk-package-alarms
PACKAGE_CLOUDANT_HOME ?= ./openwhisk-package-cloudant
PACKAGE_KAFKA_HOME ?= ./openwhisk-package-kafka
CREATE_PACKAGE_STEPS = download-package- install-package- start-provider-

create-provider-alarms: check-alarm-ports setup-providers $(addsuffix alarms,$(CREATE_PACKAGE_STEPS))

create-provider-cloudant: check-cloudant-ports setup-providers $(addsuffix cloudant,$(CREATE_PACKAGE_STEPS))

create-provider-kafka: check-kafka-ports setup-providers $(addsuffix kafka,$(CREATE_PACKAGE_STEPS))

.PHONY: setup-providers
setup-providers:
	printf "OPENWHISK_HOME=$(realpath $(OPENWHISK_PROJECT_HOME))\n" > $(TMP_HOME)/tmp/openwhisk/providers.env
	printf "ENDPOINT_AUTH=`cat $(realpath $(OPENWHISK_PROJECT_HOME))/ansible/files/auth.whisk.system`\n" >> $(TMP_HOME)/tmp/openwhisk/providers.env
	printf "HOST_MACHINE=$(DOCKER_HOST_IP)\n" >> $(TMP_HOME)/tmp/openwhisk/providers.env
	printf "DOCKER_COMPOSE_HOST=$(DOCKER_HOST_IP)\n" >> $(TMP_HOME)/tmp/openwhisk/providers.env
	printf "DOCKER_IMAGE_PREFIX=$(DOCKER_IMAGE_PREFIX)\n" >> $(TMP_HOME)/tmp/openwhisk/providers.env
	printf "DOCKER_IMAGE_TAG=$(DOCKER_IMAGE_TAG)\n" >> $(TMP_HOME)/tmp/openwhisk/providers.env

.PHONY: $(addprefix download-package-,$(PACKAGES))
$(addprefix download-package-,$(PACKAGES)):
	$(eval PACKAGE_NAME:= $(shell echo $(@) | cut -b 18-))
	$(eval PACKAGE_HOME := $(PACKAGE_$(shell echo $(PACKAGE_NAME) |  tr 'a-z' 'A-Z')_HOME))
	echo "Downloading package" $(PACKAGE_NAME) "into" $(PACKAGE_HOME)
	rm -rf ./openwhisk-package-$(PACKAGE_NAME)*
	if [ "$(PACKAGE_HOME)" = "./openwhisk-package-$(PACKAGE_NAME)" ]; then \
	    curl -s --output ./openwhisk-package-$(PACKAGE_NAME).tar.gz -L https://api.github.com/repos/apache/openwhisk-package-$(PACKAGE_NAME)/tarball/master; \
	    mkdir openwhisk-package-$(PACKAGE_NAME); \
	    tar -xf ./openwhisk-package-$(PACKAGE_NAME).tar.gz --strip 1 -C openwhisk-package-$(PACKAGE_NAME); \
	else \
	     echo "Skipping downloading the code from git as PACKAGE_HOME is not default:" $(PACKAGE_HOME); \
	fi

.PHONY: $(addprefix install-package-,$(PACKAGES))
$(addprefix install-package-,$(PACKAGES)):
	$(eval PACKAGE_NAME:= $(shell echo $(@) | cut -b 17-))
	$(eval PACKAGE_HOME := $(PACKAGE_$(shell echo $(PACKAGE_NAME) |  tr 'a-z' 'A-Z')_HOME))
	cd $(PACKAGE_HOME) && \
	$(shell cat $(TMP_HOME)/tmp/openwhisk/providers.env) ./installCatalog.sh $(realpath $(OPENWHISK_PROJECT_HOME))/ansible/files/auth.whisk.system $(DOCKER_HOST_IP) "http://$(DOCKER_HOST_IP):5984" $(OPEN_WHISK_DB_PREFIX) $(DOCKER_HOST_IP)

### Separate target for alarms because the installation requires an additional parameter
install-package-alarms:
	$(eval PACKAGE_NAME:= $(shell echo $(@) | cut -b 17-))
	$(eval PACKAGE_HOME := $(PACKAGE_$(shell echo $(PACKAGE_NAME) |  tr 'a-z' 'A-Z')_HOME))
	cd $(PACKAGE_HOME) && \
	$(shell cat $(TMP_HOME)/tmp/openwhisk/providers.env) ./installCatalog.sh $(realpath $(OPENWHISK_PROJECT_HOME))/ansible/files/auth.whisk.system $(DOCKER_HOST_IP) $(DOCKER_HOST_IP) "http://$(DOCKER_HOST_IP):5984" $(OPEN_WHISK_DB_PREFIX) $(DOCKER_HOST_IP) \

.PHONY: $(addprefix start-provider-,$(PACKAGES))
$(addprefix start-provider-,$(PACKAGES)):
	$(eval PACKAGE_NAME:= $(shell echo $(@) | cut -b 16-))
	$(shell cat $(TMP_HOME)/tmp/openwhisk/providers.env) docker-compose -f docker-compose.yml -f docker-compose.packages.yml --project-name openwhisk up --no-recreate $(PACKAGE_NAME)provider 2>&1 > $(TMP_HOME)/tmp/openwhisk/docker-provider-compose.log &

.PHONY: $(addprefix stop-provider-,$(PACKAGES))
$(addprefix stop-provider-,$(PACKAGES)): setup-providers
	$(eval PACKAGE_NAME:= $(shell echo $(@) | cut -b 15-))
	$(shell cat $(TMP_HOME)/tmp/openwhisk/providers.env) docker-compose -f docker-compose.yml -f docker-compose.packages.yml --project-name openwhisk stop $(PACKAGE_NAME)provider
