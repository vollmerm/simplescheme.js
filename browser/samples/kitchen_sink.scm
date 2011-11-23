; factorial
(define fact (lambda (n)
  (if (<= n 1) 1
  (* n (fact (- n 1))))))

(fact 10)

; tail factorial
(define helper-fact (lambda (x y)
    (if (= x 0) y
        (helper-fact (- x 1) (* x y)))))
(define tail-fact (lambda (n)
  (helper-fact n 1)))
  
(= (tail-fact 10) (fact 10))

(tail-fact 100)


; higher order functions
(define adder (lambda (x)
  (lambda (y) (+ x y)))) ; return lambda function

((adder 5) 5)

(define (map-func proc lis)
   (cond ((null? lis) (quote))
         (#t (cons (proc (car lis))
                   (map-func proc (cdr lis))))))
(define (square x) (* x x))
(map-func square '(2 3 4))

; compute length of a list
(define len (lambda (L)
  (if (null? L) 0
      (+ 1 (len (cdr L))))))

(len '(1 2 3))
(len (quote 1 2 3 (4 5)))


; misc. stuff

(define degrees-to-radians (lambda (x)
  (* x (/ PI 180))))

(= (sin (degrees-to-radians 90))
   (cos (degrees-to-radians 0)))

(list 1 2 3) ; list accepts n arguments

; quote can make symbols
(quote the end of the world)

; cond is transformed into a nested if
(cond ((= 1 2) (quote nope))
      ((= 1 1) (quote yes)))

(define isinlist (lambda (L a)
  (if (null? L) #f
      (if (= a (car L)) #t
          (isinlist (cdr L) a)))))

(isinlist (quote 1 2 3) 2)
(isinlist (quote 1 2 3) 4)

; boolean operations
(and #t #f) ; false
(and #t (or #t #f)) ; true