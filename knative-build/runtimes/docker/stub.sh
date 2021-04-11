#!/bin/bash
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

echo \
'This is a stub action that should be replaced with user code (e.g., script or compatible binary).
The input to the action is received from stdin, and up to a size of MAX_ARG_STRLEN (131071) also as an argument from the command line.
Actions may log to stdout or stderr. By convention, the last line of output must
be a stringified JSON object which represents the result of the action.'

# getting arguments from command line
# only arguments up to a size of MAX_ARG_STRLEN (else empty) supported
echo 'command line argument: '$1
echo 'command line argument length: '${#1}

# getting arguments from stdin
read inputstring
echo 'stdin input length: '${#inputstring}

# last line of output = ation result
echo '{ "error": "This is a stub action. Replace it with custom logic." }'
