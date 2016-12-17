FROM node

COPY package.json /egtib/
WORKDIR /egtib
RUN npm install
COPY . /egtib/

CMD ["/egtib/start.sh"]
ENTRYPOINT ["bash"]