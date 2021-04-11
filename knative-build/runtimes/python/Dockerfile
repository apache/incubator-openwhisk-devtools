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

# Dockerfile for python actions, overrides and extends ActionRunner from actionProxy
FROM openwhisk/dockerskeleton:nightly

RUN apk add --no-cache \
        bzip2-dev \
        gcc \
        libc-dev \
        libxslt-dev \
        libxml2-dev \
        libffi-dev \
        linux-headers \
        openssl-dev

# Install common modules for python
RUN pip install \
    beautifulsoup4==4.6.3 \
    httplib2==0.11.3 \
    kafka_python==1.4.3 \
    lxml==4.2.5 \
    python-dateutil==2.7.3 \
    requests==2.19.1 \
    scrapy==1.5.1 \
    simplejson==3.16.0 \
    virtualenv==16.0.0 \
    twisted==18.7.0

ENV FLASK_PROXY_PORT 8080

RUN mkdir -p /pythonAction
ADD pythonrunner.py /pythonAction/
RUN rm -rf /action
RUN mkdir /action

CMD ["/bin/bash", "-c", "cd pythonAction && python -u pythonrunner.py"]
